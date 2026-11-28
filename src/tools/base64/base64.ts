import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import '@awesome.me/webawesome/dist/components/button/button.js'
import { copyText } from '../../services/clipboard'
import { downloadText } from '../../services/files'
import { getLocale, subscribeToLocale, t } from '../../i18n/i18n'
import { toolStyles } from '../../theme/tool-styles'
import {
  transformBase64,
  utf8ByteLength,
  type Base64Operation,
} from './base64.core'

const operations = ['encode', 'decode'] as const

@customElement('base64-tool')
export class Base64Tool extends LitElement {
  @state() private operation: Base64Operation = 'encode'
  @state() private input = ''
  @state() private output = ''
  @state() private error: 'base64.errorEmpty' | 'base64.errorInvalid' | '' = ''
  @state() private notice:
    | 'base64.converted'
    | 'status.copied'
    | 'status.copyFailed'
    | 'status.downloadStarted'
    | 'status.downloadFailed'
    | '' = ''
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

  private selectOperation(operation: Base64Operation) {
    if (operation === this.operation) return
    this.operation = operation
    this.invalidate()
  }

  private run() {
    this.invalidate()
    try {
      this.output = transformBase64(this.input, this.operation)
      this.notice = 'base64.converted'
    } catch (error) {
      this.error =
        error instanceof Error && error.message === 'empty-input'
          ? 'base64.errorEmpty'
          : 'base64.errorInvalid'
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

  private download() {
    if (!this.output) return
    try {
      downloadText(
        this.operation === 'encode' ? 'encoded.txt' : 'decoded.txt',
        this.output,
      )
      this.notice = 'status.downloadStarted'
    } catch {
      this.notice = 'status.downloadFailed'
    }
  }

  private reset() {
    this.input = ''
    this.invalidate()
    this.renderRoot.querySelector<HTMLTextAreaElement>('#input')?.focus()
  }

  private formatCharacterCount(count: number, number: Intl.NumberFormat) {
    return t(
      count === 1 ? 'base64.characterCountOne' : 'base64.characterCount',
    ).replace('{count}', number.format(count))
  }

  render() {
    const encoding = this.operation === 'encode'
    const locale = getLocale()
    const number = new Intl.NumberFormat(locale)
    const bytes = new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: 'byte',
      unitDisplay: 'long',
    }).format(utf8ByteLength(this.input))
    return html`<section class="tool" aria-labelledby="title">
      <h1 id="title">${t('tools.base64.title')}</h1>
      <div class="modes" role="group" aria-label=${t('base64.mode')}>
        ${operations.map(
          (operation) =>
            html`<button
              type="button"
              aria-pressed=${this.operation === operation}
              @click=${() => this.selectOperation(operation)}
            >
              <span aria-hidden="true" ?hidden=${this.operation !== operation}
                >✓</span
              >
              ${t(`base64.${operation}`)}
            </button>`,
        )}
      </div>
      <div class="panels">
        <div>
          <div class="panel-header">
            <label for="input">
              ${t(encoding ? 'base64.textInput' : 'base64.base64Input')}
            </label>
            <wa-button appearance="plain" @click=${this.reset}
              >${t('actions.reset')}</wa-button
            >
          </div>
          <textarea
            id="input"
            .value=${this.input}
            placeholder=${t(
              encoding ? 'base64.textPlaceholder' : 'base64.base64Placeholder',
            )}
            aria-describedby=${this.error ? 'input-meta input-error' : 'input-meta'}
            aria-invalid=${Boolean(this.error)}
            @input=${(event: Event) => {
              this.input = (event.target as HTMLTextAreaElement).value
              this.invalidate()
            }}
            spellcheck="false"
          ></textarea>
          <p id="input-meta" class="meta">
            ${encoding ? 'UTF-8' : 'Base64'} ·
            ${this.formatCharacterCount(this.input.length, number)} · ${bytes}
          </p>
          <wa-button class="transform" variant="brand" @click=${this.run}
            >${t('base64.transform')}</wa-button
          >
          <p id="input-error" class="error" role="alert" ?hidden=${!this.error}>
            ${this.error ? t(this.error) : ''}
          </p>
        </div>
        <div>
          <div class="panel-header">
            <label for="output">
              ${t(encoding ? 'base64.encodedOutput' : 'base64.decodedOutput')}
            </label>
            <wa-button ?disabled=${!this.output} @click=${this.copy}
              >${t('actions.copy')}</wa-button
            >
          </div>
          <textarea
            id="output"
            .value=${this.output}
            placeholder=${t('base64.outputPlaceholder')}
            aria-describedby="output-meta"
            readonly
            spellcheck="false"
          ></textarea>
          <div class="result-footer">
            <p id="output-meta" class="meta">
              ${this.formatCharacterCount(this.output.length, number)}
            </p>
            <wa-button
              appearance="plain"
              ?disabled=${!this.output}
              @click=${this.download}
              >${t('actions.download')}</wa-button
            >
          </div>
          <p class="notice" role="status">
            ${this.notice ? t(this.notice) : ''}
          </p>
        </div>
      </div>
    </section>`
  }

  static styles = [
    toolStyles,
    css`
      h1 {
        margin-bottom: 24px;
        word-break: keep-all;
      }
      .modes {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
      }
      .modes button {
        min-width: 92px;
        min-height: 48px;
        padding-inline: 16px;
        border: 1px solid var(--app-border);
        border-radius: 14px;
        background: var(--tool-surface);
        color: var(--tool-text);
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }
      .modes button:hover {
        background: var(--tool-field);
      }
      .modes button[aria-pressed='true'] {
        border-color: var(--tool-focus);
        background: color-mix(
          in srgb,
          var(--tool-field),
          var(--tool-primary) 12%
        );
      }
      .modes button:focus-visible {
        outline: 2px solid var(--tool-focus);
        outline-offset: 3px;
      }
      .panels {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 24px;
      }
      .panel-header,
      .result-footer {
        display: flex;
        justify-content: space-between;
        gap: 8px;
      }
      .panel-header {
        align-items: center;
        margin-bottom: 8px;
      }
      .panel-header label {
        margin: 0;
        word-break: keep-all;
      }
      wa-button[appearance='plain']::part(button) {
        padding-inline: 12px;
      }
      textarea {
        overflow-wrap: anywhere;
      }
      textarea[readonly] {
        background: color-mix(
          in srgb,
          var(--tool-field),
          var(--tool-primary) 4%
        );
      }
      .meta,
      .notice {
        margin: 10px 0 0;
        color: var(--tool-muted);
        font-size: 0.875rem;
        line-height: 1.5;
        font-variant-numeric: tabular-nums;
        overflow-wrap: anywhere;
        word-break: keep-all;
      }
      .notice:empty {
        margin: 0;
      }
      .transform {
        --wa-color-brand-fill-loud: light-dark(
          var(--tool-primary),
          color-mix(in srgb, var(--tool-primary), var(--tool-surface) 16%)
        );
        margin-top: 20px;
      }
      @media (max-width: 720px) {
        .panels {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      @media (max-width: 600px) {
        textarea {
          min-height: 148px;
        }
        .transform {
          width: 100%;
        }
      }
      @media (forced-colors: active) {
        .modes button {
          border-color: ButtonText;
        }
      }
    `,
  ]
}
