import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import '@awesome.me/webawesome/dist/components/button/button.js'
import { subscribeToLocale, t } from '../../i18n/i18n'
import type { TranslationKey } from '../../i18n/en'
import { copyText } from '../../services/clipboard'
import { downloadBlob, readImagePixels } from '../../services/files'
import { createQr, decodeQr, safeUrl } from './qr-code.core'

@customElement('qr-code-tool')
export class QrCodeTool extends LitElement {
  @state() private mode: 'generate' | 'read' = 'generate'
  @state() private input = ''
  @state() private size = 256
  @state() private svg = ''
  @state() private png: Blob | null = null
  @state() private preview = ''
  @state() private result: string | null = null
  @state() private error: TranslationKey | '' = ''
  @state() private notice: TranslationKey | '' = ''
  @state() private busy = false
  private sequence = 0
  private unsubscribe?: () => void

  connectedCallback() {
    super.connectedCallback()
    this.unsubscribe = subscribeToLocale(() => this.requestUpdate())
  }
  disconnectedCallback() {
    this.sequence++
    this.unsubscribe?.()
    this.revoke()
    super.disconnectedCallback()
  }
  private revoke() {
    if (this.preview) URL.revokeObjectURL(this.preview)
    this.preview = ''
  }
  private clear() {
    this.sequence++
    this.revoke()
    this.svg = ''
    this.png = null
    this.result = null
    this.error = ''
    this.notice = ''
    this.busy = false
  }
  private reset() {
    this.clear()
    this.input = ''
    const file = this.renderRoot.querySelector<HTMLInputElement>('#file')
    if (file) file.value = ''
  }
  private async generate() {
    this.clear()
    const sequence = this.sequence
    try {
      const result = await createQr(this.input, this.size)
      if (sequence !== this.sequence) return
      this.svg = result.svg
      this.png = result.png
      this.preview = URL.createObjectURL(result.png)
    } catch (error) {
      if (sequence !== this.sequence) return
      const reason = error instanceof Error ? error.message : ''
      this.error =
        reason === 'empty'
          ? 'qr.empty'
          : reason === 'capacity'
            ? 'qr.capacity'
            : 'qr.imageInvalid'
    }
  }
  private async read(files: FileList | null) {
    this.clear()
    const sequence = this.sequence
    if (!files?.length) return
    if (files.length !== 1) {
      this.error = 'qr.multiple'
      return
    }
    this.busy = true
    try {
      const image = await readImagePixels(files[0]!)
      if (sequence !== this.sequence) return
      const result = decodeQr(image)
      if (result === null) this.error = 'qr.notFound'
      else this.result = result
    } catch (error) {
      if (sequence !== this.sequence) return
      const reason = error instanceof Error ? error.message : ''
      const keys: Record<string, TranslationKey> = {
        fileType: 'qr.fileType',
        fileSize: 'qr.fileSize',
        imageSize: 'qr.imageSize',
      }
      this.error = keys[reason] ?? 'qr.imageInvalid'
    } finally {
      if (sequence === this.sequence) this.busy = false
    }
  }
  private async copy() {
    try {
      await copyText(this.result ?? '')
      this.notice = 'status.copied'
    } catch {
      this.notice = 'status.copyFailed'
    }
  }
  private download(format: 'png' | 'svg') {
    try {
      const blob =
        format === 'png'
          ? this.png
          : new Blob([this.svg], { type: 'image/svg+xml' })
      if (!blob) return
      downloadBlob(`qr-code.${format}`, blob)
      this.notice = 'status.downloadStarted'
    } catch {
      this.notice = 'status.downloadFailed'
    }
  }
  render() {
    const url = this.result === null ? null : safeUrl(this.result)
    return html`<section class="tool" aria-labelledby="title">
      <h1 id="title">${t('tools.qr.title')}</h1>
      <div class="actions" role="group" aria-label=${t('qr.mode')}>
        <wa-button
          variant=${this.mode === 'generate' ? 'brand' : 'neutral'}
          aria-pressed=${this.mode === 'generate'}
          @click=${() => {
            this.mode = 'generate'
            this.reset()
          }}
          >${t('qr.generate')}</wa-button
        >
        <wa-button
          variant=${this.mode === 'read' ? 'brand' : 'neutral'}
          aria-pressed=${this.mode === 'read'}
          @click=${() => {
            this.mode = 'read'
            this.reset()
          }}
          >${t('qr.read')}</wa-button
        >
      </div>
      ${
        this.mode === 'generate'
          ? html`
              <label for="input">${t('qr.input')}</label>
              <textarea
                id="input"
                .value=${this.input}
                @input=${(e: Event) => {
                  this.input = (e.target as HTMLTextAreaElement).value
                  this.clear()
                }}
              ></textarea>
              <label for="size">${t('qr.size')}</label>
              <select
                id="size"
                .value=${String(this.size)}
                @change=${(e: Event) => {
                  this.size = Number((e.target as HTMLSelectElement).value)
                  this.clear()
                }}
              >
                <option value="256">256 × 256</option>
                <option value="512">512 × 512</option>
                <option value="1024">1024 × 1024</option>
              </select>
              <div class="actions">
                <wa-button variant="brand" @click=${this.generate}
                  >${t('qr.generateAction')}</wa-button
                ><wa-button @click=${this.reset}
                  >${t('actions.reset')}</wa-button
                >
              </div>
              ${
                this.preview
                  ? html`<div class="preview">
                        <img
                          src=${this.preview}
                          alt=${t('qr.preview')}
                          width="256"
                          height="256"
                        />
                      </div>
                      <div class="actions">
                        <wa-button @click=${() => this.download('png')}
                          >${t('qr.png')}</wa-button
                        ><wa-button @click=${() => this.download('svg')}
                          >${t('qr.svg')}</wa-button
                        >
                      </div>`
                  : ''
              }
            `
          : html`
              <div
                class="drop"
                @dragover=${(e: DragEvent) => e.preventDefault()}
                @drop=${(e: DragEvent) => {
                  e.preventDefault()
                  void this.read(e.dataTransfer?.files ?? null)
                }}
              >
                <p>${t('qr.drop')}</p>
                <label for="file">${t('qr.file')}</label
                ><input
                  id="file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  @change=${(e: Event) => {
                    const input = e.target as HTMLInputElement
                    void this.read(input.files)
                    input.value = ''
                  }}
                />
              </div>
              ${this.busy ? html`<p role="status">${t('qr.processing')}</p>` : ''}
              ${
                this.result !== null
                  ? html`<label for="result">${t('qr.result')}</label
                      ><textarea
                        id="result"
                        readonly
                        .value=${this.result}
                      ></textarea>
                      <div class="actions">
                        <wa-button @click=${this.copy}
                          >${t('actions.copy')}</wa-button
                        >${url ? html`<a href=${url} target="_blank" rel="noopener noreferrer">${t('qr.open')}</a>` : ''}
                      </div>`
                  : ''
              }
              <div class="actions">
                <wa-button @click=${this.reset}
                  >${t('actions.reset')}</wa-button
                >
              </div>
            `
      }
      ${this.error ? html`<p class="error" role="alert">${t(this.error)}</p>` : ''}
      ${this.notice ? html`<p role="status">${t(this.notice)}</p>` : ''}
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
      margin: 0 0 24px;
    }
    label {
      display: block;
      margin: 20px 0 8px;
      font-weight: 600;
    }
    textarea,
    select,
    input {
      box-sizing: border-box;
      max-width: 100%;
      color: var(--app-text);
      background: var(--app-surface);
      font: inherit;
    }
    textarea {
      width: 100%;
      min-height: 130px;
      padding: 12px;
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-md);
      resize: vertical;
    }
    select {
      padding: 8px;
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-md);
    }
    :is(textarea, select, input, a):focus-visible {
      outline: 2px solid var(--app-brand);
      outline-offset: 2px;
    }
    .actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin: 16px 0;
    }
    .drop {
      border: 2px dashed var(--app-border);
      border-radius: var(--app-radius-md);
      padding: 16px;
      margin-top: 20px;
    }
    .drop label {
      margin-top: 12px;
    }
    .preview img {
      display: block;
      max-width: 100%;
      height: auto;
      background: white;
    }
    .error {
      padding: 12px;
      border-radius: 8px;
      background: #fee2e2;
      color: #991b1b;
    }
    a {
      color: var(--app-brand);
    }
    @media (max-width: 700px) {
      .tool {
        padding: 16px;
      }
    }
  `
}
