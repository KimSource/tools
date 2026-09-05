import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import '@awesome.me/webawesome/dist/components/button/button.js'
import { copyText } from '../../services/clipboard'
import { downloadText } from '../../services/files'
import { subscribeToLocale, t } from '../../i18n/i18n'
import {
  transformBase64,
  utf8ByteLength,
  type Base64Operation,
} from './base64.core'

@customElement('base64-tool')
export class Base64Tool extends LitElement {
  @state() private operation: Base64Operation = 'encode'
  @state() private input = ''
  @state() private output = ''
  @state() private error = ''
  @state() private notice = ''
  private unsubscribe?: () => void

  connectedCallback() {
    super.connectedCallback()
    this.unsubscribe = subscribeToLocale(() => this.requestUpdate())
  }

  disconnectedCallback() {
    this.unsubscribe?.()
    super.disconnectedCallback()
  }

  private run() {
    this.error = ''
    this.notice = ''
    try {
      this.output = transformBase64(this.input, this.operation)
    } catch (error) {
      this.output = ''
      this.error =
        error instanceof Error && error.message === 'empty-input'
          ? t('base64.errorEmpty')
          : t('base64.errorInvalid')
    }
  }

  private async copy() {
    try {
      await copyText(this.output)
      this.notice = t('status.copied')
    } catch {
      this.notice = t('status.copyFailed')
    }
  }

  private download() {
    try {
      downloadText(
        this.operation === 'encode' ? 'encoded.txt' : 'decoded.txt',
        this.output,
      )
      this.notice = t('status.downloadStarted')
    } catch {
      this.notice = t('status.downloadFailed')
    }
  }

  private reset() {
    this.input = ''
    this.output = ''
    this.error = ''
    this.notice = ''
  }

  render() {
    const inputLabel =
      this.operation === 'encode'
        ? t('base64.textInput')
        : t('base64.base64Input')
    const inputPlaceholder =
      this.operation === 'encode'
        ? t('base64.textPlaceholder')
        : t('base64.base64Placeholder')
    return html`<section class="tool" aria-labelledby="title">
      <p class="eyebrow">${t('base64.eyebrow')}</p>
      <h1 id="title">${t('tools.base64.title')}</h1>
      <div class="mode" role="group" aria-label=${t('base64.mode')}>
        <wa-button
          variant=${this.operation === 'encode' ? 'brand' : 'neutral'}
          @click=${() => {
            this.operation = 'encode'
            this.reset()
          }}
          >${t('base64.encode')}</wa-button
        >
        <wa-button
          variant=${this.operation === 'decode' ? 'brand' : 'neutral'}
          @click=${() => {
            this.operation = 'decode'
            this.reset()
          }}
          >${t('base64.decode')}</wa-button
        >
      </div>
      <div class="panels">
        <div class="panel">
          <label for="input">${inputLabel}</label>
          <textarea
            id="input"
            .value=${this.input}
            @input=${(event: Event) => {
              this.input = (event.target as HTMLTextAreaElement).value
              this.output = ''
              this.error = ''
              this.notice = ''
            }}
            placeholder=${inputPlaceholder}
            spellcheck="false"
          ></textarea>
          <span class="meta"
            >${this.input.length} ${t('base64.characters')} ·
            ${utf8ByteLength(this.input)} ${t('base64.bytes')}</span
          >
        </div>
        <div class="panel">
          <label for="output">${t('base64.output')}</label>
          <textarea
            id="output"
            .value=${this.output}
            readonly
            spellcheck="false"
          ></textarea>
          <span class="meta"
            >${this.output.length} ${t('base64.characters')}</span
          >
        </div>
      </div>
      <div class="actions">
        <wa-button variant="brand" @click=${this.run}
          >${t('base64.transform')}</wa-button
        >
        <wa-button appearance="outlined" @click=${this.reset}
          >${t('actions.reset')}</wa-button
        >
        <span class="spacer"></span>
        <wa-button ?disabled=${!this.output} @click=${this.copy}
          >${t('actions.copy')}</wa-button
        >
        <wa-button ?disabled=${!this.output} @click=${this.download}
          >${t('actions.download')}</wa-button
        >
      </div>
      ${this.error ? html`<p class="error" role="alert">${this.error}</p>` : ''}
      ${this.notice ? html`<p class="notice" role="status">${this.notice}</p>` : ''}
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
    .eyebrow {
      color: var(--app-brand);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.12em;
    }
    h1 {
      margin: 12px 0 24px;
    }
    .mode,
    .actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .mode {
      margin-bottom: 20px;
    }
    .panels {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    label {
      display: block;
      margin: 0 0 8px;
      font-weight: 600;
    }
    textarea {
      display: block;
      box-sizing: border-box;
      width: 100%;
      min-height: 280px;
      padding: 16px;
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-md);
      background: var(--app-surface);
      color: var(--app-text);
      font:
        14px/1.5 ui-monospace,
        monospace;
      resize: vertical;
    }
    textarea:focus-visible {
      outline: 2px solid var(--app-brand);
      outline-offset: 2px;
    }
    .meta {
      display: block;
      margin-top: 8px;
      color: var(--app-muted);
      font-size: 0.875rem;
    }
    .actions {
      margin-top: 20px;
    }
    .spacer {
      flex: 1;
    }
    .error,
    .notice {
      margin: 16px 0 0;
      padding: 12px;
      border-radius: 8px;
    }
    .error {
      background: #fee2e2;
      color: #991b1b;
    }
    .notice {
      color: var(--app-muted);
    }
    @media (max-width: 700px) {
      .tool {
        padding: 16px;
      }
      .panels {
        grid-template-columns: 1fr;
      }
      .actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .actions .spacer {
        display: none;
      }
      .actions wa-button {
        width: 100%;
      }
    }
  `
}
