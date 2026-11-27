import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import '@awesome.me/webawesome/dist/components/button/button.js'
import { getLocale, subscribeToLocale, t } from '../../i18n/i18n'
import { copyText, readPastedImages } from '../../services/clipboard'
import { readFileBytes, singleFile } from '../../services/files'
import { toolStyles } from '../../theme/tool-styles'
import {
  generateHash,
  hashInputByteLength,
  type HashAlgorithm,
} from './hash-generator.core'

const fileLimitMiB = 32
const fileLimitBytes = fileLimitMiB * 1024 * 1024

type InputMode = 'text' | 'file'
type FileSelection = { file: File; source: 'file' | 'paste' }
type HashError =
  | 'hash.error'
  | 'hash.fileReadError'
  | 'hash.fileTooLarge'
  | 'hash.fileMultiple'
  | 'hash.pasteMultiple'

@customElement('hash-generator-tool')
export class HashGeneratorTool extends LitElement {
  @state() private mode: InputMode = 'text'
  @state() private input = ''
  @state() private selection: FileSelection | null = null
  @state() private algorithm: HashAlgorithm = 'SHA-256'
  @state() private output = ''
  @state() private error: HashError | '' = ''
  @state() private notice: 'status.copied' | 'status.copyFailed' | '' = ''
  @state() private pending = false
  private version = 0
  private unsubscribe?: () => void

  connectedCallback() {
    super.connectedCallback()
    this.unsubscribe = subscribeToLocale(() => this.requestUpdate())
  }

  disconnectedCallback() {
    this.version++
    this.unsubscribe?.()
    super.disconnectedCallback()
  }

  private invalidate() {
    this.version++
    this.output = ''
    this.error = ''
    this.notice = ''
  }

  private selectMode(mode: InputMode) {
    if (mode === this.mode) return
    this.mode = mode
    this.invalidate()
  }

  private reset() {
    if (this.mode === 'text') this.input = ''
    else this.selection = null
    this.invalidate()
  }

  private selectFile(
    files: FileList | readonly File[] | null,
    source: FileSelection['source'] = 'file',
  ) {
    let file: File | null
    try {
      file = singleFile(files)
    } catch {
      this.error =
        source === 'paste' ? 'hash.pasteMultiple' : 'hash.fileMultiple'
      return
    }
    if (!file) return
    if (file.size > fileLimitBytes) {
      this.error = 'hash.fileTooLarge'
      return
    }
    this.selection = { file, source }
    this.invalidate()
    if (this.mode === 'text') {
      this.mode = 'file'
      this.renderRoot
        .querySelector<HTMLButtonElement>('#file-mode')
        ?.focus({ preventScroll: true })
    }
  }

  private paste(event: ClipboardEvent) {
    const images = readPastedImages(event)
    if (!images.length) return
    event.preventDefault()
    this.selectFile(images, 'paste')
  }

  private async run() {
    const file = this.mode === 'file' ? this.selection?.file : null
    if (this.pending || (this.mode === 'file' && !file)) return
    this.invalidate()
    const version = this.version
    const algorithm = this.algorithm
    let error: HashError = file ? 'hash.fileReadError' : 'hash.error'
    this.pending = true
    try {
      const input = file ? await readFileBytes(file) : this.input
      if (version !== this.version) return
      error = 'hash.error'
      const output = await generateHash(input, algorithm)
      if (version === this.version) this.output = output
    } catch {
      if (version === this.version) this.error = error
    } finally {
      this.pending = false
    }
  }

  private async copy() {
    if (!this.output) return
    const version = this.version
    let notice: typeof this.notice = 'status.copied'
    try {
      await copyText(this.output)
    } catch {
      notice = 'status.copyFailed'
    }
    if (version === this.version) this.notice = notice
  }

  private formatSize(bytes: number): string {
    return new Intl.NumberFormat(getLocale(), {
      style: 'unit',
      unit: 'byte',
      unitDisplay: 'long',
    }).format(bytes)
  }

  private fileMessage(key: HashError | 'hash.fileLimit'): string {
    return t(key).replace('{limit}', String(fileLimitMiB))
  }

  private renderTextInput() {
    return html`<textarea
        id="input"
        .value=${this.input}
        aria-describedby="input-hint"
        @input=${(event: Event) => {
          this.input = (event.target as HTMLTextAreaElement).value
          this.invalidate()
        }}
        spellcheck="false"
      ></textarea>
      <div class="input-meta">
        <span>UTF-8 · ${this.formatSize(hashInputByteLength(this.input))}</span>
        <span id="input-hint">${t('hash.inputHint')}</span>
      </div>`
  }

  private renderFileInput() {
    const selection = this.selection
    return html`<div
        class="file-drop"
        role="group"
        aria-labelledby="file-title"
        aria-describedby="file-limit file-paste-hint"
        @dragover=${(event: DragEvent) => event.preventDefault()}
        @drop=${(event: DragEvent) => {
          event.preventDefault()
          this.selectFile(event.dataTransfer?.files ?? null)
        }}
      >
        <div class="file-info" aria-live="polite">
          ${
            selection
              ? html`<p class="file-name">
                    ${
                      selection.source === 'paste'
                        ? `${t('hash.pastedImage')} · ${selection.file.type.slice('image/'.length).toUpperCase()}`
                        : selection.file.name
                    }
                  </p>
                  <p class="file-detail">
                    ${this.formatSize(selection.file.size)}
                  </p>`
              : ''
          }
        </div>
        <div class="file-actions">
          <input
            id="file"
            type="file"
            aria-label=${t('hash.fileChoose')}
            hidden
            @change=${(event: Event) => {
              const input = event.target as HTMLInputElement
              this.selectFile(input.files)
              input.value = ''
            }}
          />
          <wa-button
            class="file-picker"
            @click=${() =>
              this.renderRoot.querySelector<HTMLInputElement>('#file')?.click()}
          >
            ${t(selection ? 'hash.fileChange' : 'hash.fileChoose')}
          </wa-button>
          <span class="file-detail">${t('hash.fileDrop')}</span>
        </div>
        <p id="file-paste-hint" class="file-detail paste-hint">
          ${t('hash.filePasteHint')}
        </p>
      </div>
      <p class="input-meta" id="file-limit">
        ${this.fileMessage('hash.fileLimit')}
      </p>`
  }

  render() {
    return html`<section
      class="tool"
      aria-labelledby="title"
      @paste=${this.paste}
    >
      <h1 id="title">${t('tools.hashGenerator.title')}</h1>
      <div class="input-modes" role="group" aria-label=${t('hash.inputType')}>
        ${(['text', 'file'] as const).map(
          (mode) =>
            html`<button
              id=${`${mode}-mode`}
              type="button"
              aria-pressed=${this.mode === mode}
              @click=${(event: MouseEvent) => {
                const button = event.currentTarget as HTMLButtonElement
                button.focus({ preventScroll: true })
                this.selectMode(mode)
              }}
            >
              <span aria-hidden="true" ?hidden=${this.mode !== mode}>✓</span>
              ${t(mode === 'text' ? 'hash.textMode' : 'hash.fileMode')}
            </button>`,
        )}
      </div>
      <div class="panels">
        <div>
          <div class="panel-header">
            ${
              this.mode === 'text'
                ? html`<label for="input">${t('hash.input')}</label>`
                : html`<h2 id="file-title">${t('hash.fileInput')}</h2>`
            }
            <wa-button appearance="plain" @click=${this.reset}
              >${t('actions.reset')}</wa-button
            >
          </div>
          ${this.mode === 'text' ? this.renderTextInput() : this.renderFileInput()}
          <div class="controls">
            <div class="algorithm">
              <label for="algorithm">${t('hash.algorithm')}</label>
              <select
                id="algorithm"
                .value=${this.algorithm}
                @change=${(event: Event) => {
                  this.algorithm = (event.target as HTMLSelectElement)
                    .value as HashAlgorithm
                  this.invalidate()
                }}
              >
                <option value="SHA-256">SHA-256</option>
                <option value="SHA-384">SHA-384</option>
                <option value="SHA-512">SHA-512</option>
              </select>
            </div>
            <wa-button
              class="generate"
              variant="brand"
              ?disabled=${
                this.pending || (this.mode === 'file' && !this.selection)
              }
              ?loading=${this.pending}
              @click=${this.run}
              >${t('hash.generate')}</wa-button
            >
          </div>
          ${
            this.error
              ? html`<p class="error" role="alert">
                  ${this.fileMessage(this.error)}
                </p>`
              : ''
          }
        </div>
        <section class="results" aria-labelledby="result-title">
          <div class="panel-header">
            <h2 id="result-title">${t('hash.result')}</h2>
            <wa-button ?disabled=${!this.output} @click=${this.copy}
              >${t('actions.copy')}</wa-button
            >
          </div>
          <div class="result-field">
            <p class="result-format">${this.algorithm} · HEX</p>
            <textarea
              class="digest"
              aria-label=${t('hash.output')}
              .value=${this.output}
              rows="6"
              readonly
              spellcheck="false"
            ></textarea>
          </div>
          ${
            this.notice
              ? html`<p class="notice" role="status">${t(this.notice)}</p>`
              : ''
          }
        </section>
      </div>
    </section>`
  }

  static styles = [
    toolStyles,
    css`
      h1 {
        margin-bottom: 24px;
      }
      .input-modes {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
      }
      .input-modes button {
        min-width: 92px;
        min-height: 48px;
        padding: 0 16px;
        border: 1px solid var(--app-border);
        border-radius: 14px;
        background: var(--tool-surface);
        color: var(--tool-text);
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }
      .input-modes button[aria-pressed='true'] {
        border-color: var(--tool-focus);
        background: color-mix(
          in srgb,
          var(--tool-field),
          var(--tool-primary) 12%
        );
      }
      .panels {
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
        gap: 24px;
      }
      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
      }
      .panel-header h2,
      .panel-header label {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
      }
      .input-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 16px;
        margin: 10px 0 0;
      }
      .file-drop {
        display: grid;
        align-content: center;
        box-sizing: border-box;
        min-height: 220px;
        padding: 20px;
        border: 1px dashed var(--tool-muted);
        border-radius: 16px;
        background: var(--tool-field);
      }
      .file-info p {
        margin: 0;
      }
      .file-info .file-detail {
        margin: 4px 0 12px;
      }
      .file-name {
        overflow-wrap: anywhere;
        font-weight: 600;
      }
      .file-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px 12px;
      }
      .paste-hint {
        margin: 8px 0 0;
      }
      wa-button.file-picker::part(button) {
        border-color: var(--app-border);
        background: var(--tool-surface);
      }
      .input-meta,
      .file-detail,
      .result-format,
      .notice {
        color: var(--tool-muted);
        font-size: 0.875rem;
        line-height: 1.5;
      }
      .controls {
        display: grid;
        grid-template-columns: max-content max-content;
        align-items: end;
        gap: 12px;
        margin-top: 20px;
      }
      .algorithm label {
        margin-bottom: 8px;
      }
      select {
        box-sizing: border-box;
        width: 100%;
        min-height: 48px;
        padding: 0 12px;
        border: 1px solid transparent;
        border-radius: 14px;
        background: var(--tool-field);
        color: var(--tool-text);
        font: inherit;
        font-weight: 600;
      }
      select:focus-visible,
      .input-modes button:focus-visible {
        outline: 2px solid var(--tool-focus);
        outline-offset: 3px;
      }
      .result-field {
        padding: 16px;
        border-radius: 16px;
        background: color-mix(
          in srgb,
          var(--tool-field),
          var(--tool-primary) 4%
        );
      }
      .result-format {
        margin: 0 0 8px;
      }
      .digest {
        min-height: 2lh;
        padding: 0;
        border-radius: 0;
        background: transparent;
        overflow-wrap: anywhere;
        resize: none;
        field-sizing: content;
      }
      @media (max-width: 720px) {
        .panels {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      @media (max-width: 600px) {
        .file-drop {
          min-height: 160px;
          padding: 16px;
        }
        .controls {
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
        }
        .generate::part(button) {
          padding-inline: 10px;
        }
      }
      @media (forced-colors: active) {
        select,
        .input-modes button,
        .file-drop,
        wa-button.file-picker::part(button) {
          border-color: ButtonText;
        }
      }
    `,
  ]
}
