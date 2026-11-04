import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import '@awesome.me/webawesome/dist/components/button/button.js'
import { getLocale, subscribeToLocale, t } from '../../i18n/i18n'
import type { TranslationKey } from '../../i18n/en'
import {
  downloadBlob,
  previewUrl,
  singleFile,
  type PreviewUrl,
} from '../../services/files'
import {
  aspectRatio,
  changeSizeMode,
  editDimension,
  defaultSettings,
  imageFormats,
  outputFilename,
  resizeDimensions,
  sizeChange,
  type EditSettings,
  type ImageError,
  type ImageFormat,
  type Size,
} from './image-editor-converter.core'
import {
  loadImage,
  renderImage,
  sourceThumbnail,
  supportedFormats,
  type ImageSource,
} from './image-editor-converter.image'

const formatNames: Record<ImageFormat, string> = {
  png: 'PNG',
  jpeg: 'JPG',
  webp: 'WebP',
}
const errorKeys: Record<ImageError, TranslationKey> = {
  multiple: 'image.multiple',
  fileType: 'image.fileType',
  fileSize: 'image.fileSize',
  imageSize: 'image.imageSize',
  imageInvalid: 'image.imageInvalid',
  animation: 'image.animation',
  dimensions: 'image.dimensions',
  upscale: 'image.upscale',
  background: 'image.backgroundError',
  quality: 'image.qualityError',
  outputFormat: 'image.outputFormat',
  encode: 'image.encodeError',
}
interface ImageResult extends Size {
  blob: Blob
  preview: PreviewUrl
  format: ImageFormat
  filename: string
}

@customElement('image-editor-converter-tool')
export class ImageEditorConverter extends LitElement {
  @state() private source: ImageSource | null = null
  @state() private settings: EditSettings = defaultSettings(
    { width: 1, height: 1 },
    'png',
  )
  @state() private originalPreview: PreviewUrl | null = null
  @state() private result: ImageResult | null = null
  @state() private formats: ReadonlySet<ImageFormat> | null = null
  @state() private busy = false
  @state() private error: TranslationKey | '' = ''
  @state() private notice: TranslationKey | '' = ''
  private sequence = 0
  private unsubscribe?: () => void

  connectedCallback() {
    super.connectedCallback()
    this.unsubscribe = subscribeToLocale(() => this.requestUpdate())
    void supportedFormats().then((formats) => {
      if (!this.isConnected) return
      this.formats = formats
      if (!formats.size) this.error = 'image.outputFormat'
    })
  }
  disconnectedCallback() {
    this.sequence++
    this.unsubscribe?.()
    this.clearResult()
    this.originalPreview?.revoke()
    this.originalPreview = null
    this.source?.bitmap.close()
    this.source = null
    this.busy = false
    super.disconnectedCallback()
  }
  private clearResult() {
    this.result?.preview.revoke()
    this.result = null
  }
  private invalidate() {
    this.sequence++
    this.clearResult()
    this.error = ''
    this.notice = ''
  }
  private report(error: unknown) {
    const reason = error instanceof Error ? error.message : ''
    this.error = errorKeys[reason as ImageError] ?? 'image.imageInvalid'
  }
  private async read(files: FileList | readonly File[] | null) {
    if (this.busy) return
    let file: File | null
    try {
      file = singleFile(files)
    } catch (error) {
      this.error = ''
      this.report(error)
      return
    }
    if (!file) return
    this.error = ''
    this.notice = ''
    this.busy = true
    const sequence = ++this.sequence
    let next: ImageSource | null = null
    let preview: PreviewUrl | null = null
    try {
      next = await loadImage(file)
      if (sequence !== this.sequence) return
      preview = previewUrl(await sourceThumbnail(next))
      if (sequence !== this.sequence) return
      this.clearResult()
      this.originalPreview?.revoke()
      this.source?.bitmap.close()
      this.source = next
      this.originalPreview = preview
      next = null
      preview = null
      this.restoreSettings()
    } catch (error) {
      if (sequence === this.sequence) this.report(error)
    } finally {
      next?.bitmap.close()
      preview?.revoke()
      if (sequence === this.sequence) this.busy = false
    }
  }
  private restoreSettings() {
    if (!this.source) return
    const format = this.formats?.has(this.source.format)
      ? this.source.format
      : this.formats?.has('png')
        ? 'png'
        : ([...(this.formats ?? [])][0] ?? 'png')
    this.settings = defaultSettings(this.source, format)
    if (format !== this.source.format) this.notice = 'image.formatFallback'
  }
  private reset() {
    this.invalidate()
    this.restoreSettings()
  }
  private change(patch: Partial<EditSettings>) {
    this.invalidate()
    this.settings = { ...this.settings, ...patch }
  }
  private dimension(axis: 'width' | 'height', value: string) {
    if (this.source)
      this.change(editDimension(this.source, this.settings, axis, value))
  }
  private switchMode(mode: EditSettings['mode']) {
    if (!this.source || mode === this.settings.mode) return
    try {
      this.change(changeSizeMode(this.source, this.settings, mode))
    } catch (error) {
      this.report(error)
    }
  }

  private lock(keepAspect: boolean) {
    this.change({ keepAspect })
    if (keepAspect)
      this.dimension(this.settings.anchor, this.settings[this.settings.anchor])
  }
  private async generate() {
    if (!this.source || this.busy) return
    this.invalidate()
    const sequence = this.sequence
    const settings = { ...this.settings }
    this.busy = true
    try {
      if (!this.formats?.has(settings.format)) throw new Error('outputFormat')
      const size = resizeDimensions(this.source, settings)
      const blob = await renderImage(this.source, settings)
      if (sequence !== this.sequence) return
      this.result = {
        blob,
        preview: previewUrl(blob),
        format: settings.format,
        ...size,
        filename: outputFilename(this.source.file.name, settings.format),
      }
    } catch (error) {
      if (sequence === this.sequence) this.report(error)
    } finally {
      if (sequence === this.sequence) this.busy = false
    }
  }
  private download() {
    if (!this.result) return
    try {
      downloadBlob(this.result.filename, this.result.blob)
      this.notice = 'status.downloadStarted'
    } catch {
      this.notice = 'status.downloadFailed'
    }
  }
  private bytes(value: number): string {
    const number = new Intl.NumberFormat(getLocale())
    return `${number.format(value)} B (${new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 2 }).format(value / 1024 / 1024)} MiB)`
  }
  private get target(): Size | null {
    if (!this.source) return null
    try {
      return resizeDimensions(this.source, this.settings)
    } catch {
      return null
    }
  }
  render() {
    const source = this.source
    const settings = this.settings
    const target = this.target
    const change =
      source && this.result
        ? sizeChange(source.file.size, this.result.blob.size)
        : 0
    const percent = new Intl.NumberFormat(getLocale(), {
      maximumFractionDigits: 2,
      signDisplay: 'always',
    }).format(change)
    return html`<section
      class="tool"
      aria-labelledby="title"
      aria-busy=${this.busy}
    >
      <h1 id="title">${t('tools.image.title')}</h1>
      <p class="hint" id="input-help">${t('image.inputHelp')}</p>
      <div
        class="drop"
        @dragover=${(event: DragEvent) => event.preventDefault()}
        @drop=${(event: DragEvent) => {
          event.preventDefault()
          void this.read(event.dataTransfer?.files ?? null)
        }}
      >
        <p>${t('image.drop')}</p>
        <label for="file">${t('image.file')}</label>
        <input
          id="file"
          type="file"
          accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
          aria-describedby="input-help"
          ?disabled=${this.busy || !this.formats}
          @change=${(event: Event) => {
            const input = event.target as HTMLInputElement
            void this.read(input.files)
            input.value = ''
          }}
        />
      </div>
      ${
        source
          ? html`<div class="workspace">
              <section aria-labelledby="original-title">
                <h2 id="original-title">${t('image.original')}</h2>
                <dl>
                  <dt>${t('image.filename')}</dt>
                  <dd>${source.file.name}</dd>
                  <dt>${t('image.format')}</dt>
                  <dd>${formatNames[source.format]}</dd>
                  <dt>${t('image.fileBytes')}</dt>
                  <dd>${this.bytes(source.file.size)}</dd>
                  <dt>${t('image.imageDimensions')}</dt>
                  <dd>${source.width} × ${source.height} px</dd>
                  <dt>${t('image.ratio')}</dt>
                  <dd>${aspectRatio(source)}</dd>
                </dl>
                ${this.originalPreview ? html`<div class="preview"><img src=${this.originalPreview.url} alt=${t('image.originalPreview')} /></div>` : ''}
              </section>
              <section aria-labelledby="settings-title">
                <h2 id="settings-title">${t('image.settings')}</h2>
                <fieldset
                  ?disabled=${this.busy}
                  aria-describedby="edit-help error"
                >
                  <legend>${t('image.resize')}</legend>
                  <label for="mode">${t('image.sizeMode')}</label>
                  <select
                    id="mode"
                    .value=${settings.mode}
                    @change=${(event: Event) => {
                      const select = event.target as HTMLSelectElement
                      this.switchMode(select.value as EditSettings['mode'])
                      select.value = this.settings.mode
                    }}
                  >
                    <option value="pixels">${t('image.pixels')}</option>
                    <option value="percent">${t('image.percent')}</option>
                  </select>
                  <div class="dimensions">
                    <div>
                      <label for="width"
                        >${t('image.width')}
                        (${settings.mode === 'pixels' ? 'px' : '%'})</label
                      >
                      <input
                        id="width"
                        type="number"
                        min=${settings.mode === 'pixels' ? '1' : '0.000001'}
                        step=${settings.mode === 'pixels' ? '1' : 'any'}
                        .value=${settings.width}
                        @input=${(event: Event) => this.dimension('width', (event.target as HTMLInputElement).value)}
                      />
                    </div>
                    <div>
                      <label for="height"
                        >${t('image.height')}
                        (${settings.mode === 'pixels' ? 'px' : '%'})</label
                      >
                      <input
                        id="height"
                        type="number"
                        min=${settings.mode === 'pixels' ? '1' : '0.000001'}
                        step=${settings.mode === 'pixels' ? '1' : 'any'}
                        .value=${settings.height}
                        @input=${(event: Event) => this.dimension('height', (event.target as HTMLInputElement).value)}
                      />
                    </div>
                  </div>
                  <label class="check"
                    ><input
                      type="checkbox"
                      .checked=${settings.keepAspect}
                      @change=${(event: Event) => this.lock((event.target as HTMLInputElement).checked)}
                    />${t('image.keepAspect')}</label
                  >
                  <label class="check"
                    ><input
                      type="checkbox"
                      .checked=${settings.allowUpscale}
                      @change=${(event: Event) => this.change({ allowUpscale: (event.target as HTMLInputElement).checked })}
                    />${t('image.allowUpscale')}</label
                  >
                  <p class="hint" id="edit-help">${t('image.editHelp')}</p>
                  ${target ? html`<p class="target">${t('image.target')}: ${target.width} × ${target.height} px</p>` : ''}
                </fieldset>
                <fieldset
                  ?disabled=${this.busy}
                  aria-describedby="format-help error"
                >
                  <legend>${t('image.export')}</legend>
                  <label for="format">${t('image.output')}</label>
                  <select
                    id="format"
                    @change=${(event: Event) => this.change({ format: (event.target as HTMLSelectElement).value as ImageFormat })}
                  >
                    ${imageFormats.map((format) => html`<option value=${format} .selected=${settings.format === format} ?disabled=${!this.formats?.has(format)}>${formatNames[format]}${this.formats?.has(format) ? '' : ` (${t('image.unsupported')})`}</option>`)}
                  </select>
                  <p class="hint" id="format-help">${t('image.formatHelp')}</p>
                  ${
                    settings.format !== 'png'
                      ? html`<label for="quality">${t('image.quality')}</label>
                          <input
                            id="quality"
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            .value=${settings.quality}
                            @input=${(event: Event) => this.change({ quality: (event.target as HTMLInputElement).value })}
                          />`
                      : ''
                  }
                  ${
                    settings.format === 'jpeg'
                      ? html`<label for="background"
                            >${t('image.background')}</label
                          >
                          <div class="colors">
                            <input
                              id="background"
                              type="text"
                              .value=${settings.background}
                              spellcheck="false"
                              @input=${(event: Event) => this.change({ background: (event.target as HTMLInputElement).value })}
                            />
                            <input
                              type="color"
                              aria-label=${t('image.backgroundPicker')}
                              .value=${/^#[\da-f]{6}$/i.test(settings.background) ? settings.background : '#ffffff'}
                              @input=${(event: Event) => this.change({ background: (event.target as HTMLInputElement).value })}
                            />
                          </div>
                          <p class="hint">${t('image.backgroundHelp')}</p>`
                      : ''
                  }
                </fieldset>
                <div class="actions">
                  <wa-button
                    variant="brand"
                    ?disabled=${this.busy}
                    @click=${this.generate}
                    >${t('image.generate')}</wa-button
                  >
                  <wa-button ?disabled=${this.busy} @click=${this.reset}
                    >${t('image.reset')}</wa-button
                  >
                </div>
              </section>
            </div>`
          : ''
      }
      ${!this.formats || this.busy ? html`<p role="status">${t('image.processing')}</p>` : ''}
      <div id="error">
        ${this.error ? html`<p class="error" role="alert">${t(this.error)}</p>` : ''}
      </div>
      ${
        this.result
          ? html`<section class="result" aria-labelledby="result-title">
              <h2 id="result-title">${t('image.result')}</h2>
              <p role="status">
                ${formatNames[this.result.format]} · ${this.result.width} ×
                ${this.result.height} px · ${this.bytes(this.result.blob.size)}
              </p>
              <p class="comparison">
                ${t('image.change')}: ${percent}%
                (${new Intl.NumberFormat(getLocale(), { signDisplay: 'always' }).format(this.result.blob.size - source!.file.size)}
                B)
              </p>
              ${change > 0 ? html`<p class="hint larger" role="status">${t('image.larger')}</p>` : ''}
              <div class="preview">
                <img
                  src=${this.result.preview.url}
                  alt=${t('image.resultPreview')}
                />
              </div>
              <div class="actions">
                <wa-button @click=${this.download}
                  >${t('actions.download')}</wa-button
                >
              </div>
            </section>`
          : source
            ? html`<p class="hint">${t('image.needsGenerate')}</p>`
            : ''
      }
      ${this.notice ? html`<p role="status">${t(this.notice)}</p>` : ''}
      <p class="hint">${t('image.limitations')}</p>
    </section>`
  }
  static styles = css`
    :host {
      display: block;
      color: var(--app-text);
    }
    .tool {
      padding: 32px;
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-lg);
      background: var(--app-surface);
      box-shadow: var(--app-shadow);
    }
    h1 {
      margin: 0 0 16px;
    }
    h2 {
      font-size: 1.15rem;
      margin: 24px 0 16px;
    }
    .hint {
      color: var(--app-muted);
      line-height: 1.6;
      font-size: 0.875rem;
    }
    .drop {
      border: 2px dashed var(--app-border);
      border-radius: var(--app-radius-md);
      padding: 16px;
    }
    .workspace {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 24px;
    }
    section,
    dd,
    fieldset {
      min-width: 0;
    }
    dl {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 8px 16px;
    }
    dt {
      color: var(--app-muted);
    }
    dd {
      margin: 0;
      overflow-wrap: anywhere;
    }
    fieldset {
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-md);
      margin: 16px 0;
      padding: 16px;
    }
    legend {
      font-weight: 600;
    }
    label {
      display: block;
      margin: 12px 0 8px;
    }
    input,
    select {
      box-sizing: border-box;
      max-width: 100%;
      border: 1px solid var(--app-border);
      border-radius: 8px;
      background: var(--app-surface);
      color: var(--app-text);
      padding: 10px;
      font: inherit;
    }
    input:not([type='checkbox']),
    select {
      width: 100%;
    }
    input[type='file'] {
      padding: 8px 0;
      border: 0;
    }
    .dimensions {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 12px;
    }
    .check {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    input[type='checkbox'] {
      width: 18px;
      height: 18px;
      accent-color: var(--app-brand);
    }
    .colors {
      display: flex;
      gap: 8px;
    }
    .colors input[type='color'] {
      width: 64px;
      height: 44px;
      flex-shrink: 0;
      padding: 4px;
    }
    :is(input, select):focus-visible {
      outline: 2px solid var(--app-brand);
      outline-offset: 2px;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 16px 0;
    }
    .preview {
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-md);
      padding: 8px;
      background-color: var(--app-surface);
      background-image: conic-gradient(
        var(--app-border) 25%,
        transparent 0 50%,
        var(--app-border) 0 75%,
        transparent 0
      );
      background-size: 20px 20px;
      text-align: center;
    }
    img {
      display: block;
      max-width: 100%;
      max-height: 480px;
      width: auto;
      height: auto;
      margin: auto;
      object-fit: contain;
    }
    .error {
      border: 1px solid var(--app-brand);
      border-radius: 8px;
      padding: 12px;
      color: var(--app-text);
      background: var(--app-brand-soft);
    }
    .result {
      border-top: 1px solid var(--app-border);
      margin-top: 24px;
      overflow-wrap: anywhere;
    }
    @media (max-width: 700px) {
      .tool {
        padding: 16px;
      }
      .workspace {
        grid-template-columns: minmax(0, 1fr);
        gap: 0;
      }
      dl {
        grid-template-columns: minmax(0, 1fr);
        gap: 4px;
      }
      dd {
        margin-bottom: 8px;
      }
    }
  `
}
