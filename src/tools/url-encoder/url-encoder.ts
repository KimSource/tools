import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import '@awesome.me/webawesome/dist/components/button/button.js'
import { subscribeToLocale, t } from '../../i18n/i18n'
import { copyText } from '../../services/clipboard'
import { transformUrl, type UrlOperation } from './url-encoder.core'

@customElement('url-encoder-tool')
export class UrlEncoderTool extends LitElement {
  @state() private operation: UrlOperation = 'encode'
  @state() private input = ''
  @state() private output = ''
  @state() private error: 'empty' | 'invalid' | '' = ''
  @state() private notice: 'copied' | 'failed' | '' = ''
  private unsubscribe?: () => void

  connectedCallback() {
    super.connectedCallback()
    this.unsubscribe = subscribeToLocale(() => this.requestUpdate())
  }
  disconnectedCallback() {
    this.unsubscribe?.()
    super.disconnectedCallback()
  }
  private invalidate() {
    this.output = ''
    this.error = ''
    this.notice = ''
  }
  private run() {
    this.invalidate()
    try {
      this.output = transformUrl(this.input, this.operation)
    } catch (error) {
      this.error =
        error instanceof Error && error.message === 'empty-input'
          ? 'empty'
          : 'invalid'
    }
  }
  private async copy() {
    try {
      await copyText(this.output)
      this.notice = 'copied'
    } catch {
      this.notice = 'failed'
    }
  }
  render() {
    return html`<section class="tool" aria-labelledby="title">
      <p class="eyebrow">${t('url.eyebrow')}</p>
      <h1 id="title">${t('tools.urlEncoder.title')}</h1>
      <label for="operation">${t('url.mode')}</label>
      <select
        id="operation"
        .value=${this.operation}
        @change=${(event: Event) => {
          this.operation = (event.target as HTMLSelectElement)
            .value as UrlOperation
          this.invalidate()
        }}
      >
        <option value="encode">${t('url.encode')}</option>
        <option value="decode">${t('url.decode')}</option>
        <option value="query">${t('url.query')}</option>
      </select>
      <p class="hint">
        ${this.operation === 'query' ? t('url.queryHint') : t('url.componentHint')}
      </p>
      <div class="panels">
        <div>
          <label for="input">${t('url.input')}</label>
          <textarea
            id="input"
            .value=${this.input}
            @input=${(event: Event) => {
              this.input = (event.target as HTMLTextAreaElement).value
              this.invalidate()
            }}
            spellcheck="false"
          ></textarea>
        </div>
        <div>
          <label for="output">${t('url.output')}</label>
          <textarea
            id="output"
            .value=${this.output}
            readonly
            spellcheck="false"
          ></textarea>
        </div>
      </div>
      <div class="actions">
        <wa-button variant="brand" @click=${this.run}
          >${t('url.transform')}</wa-button
        >
        <wa-button
          appearance="outlined"
          @click=${() => {
            this.input = ''
            this.invalidate()
          }}
          >${t('actions.reset')}</wa-button
        >
        <wa-button ?disabled=${!this.output} @click=${this.copy}
          >${t('actions.copy')}</wa-button
        >
      </div>
      ${this.error ? html`<p class="error" role="alert">${t(this.error === 'empty' ? 'url.errorEmpty' : 'url.errorInvalid')}</p>` : ''}
      ${this.notice ? html`<p class="notice" role="status">${t(this.notice === 'copied' ? 'status.copied' : 'status.copyFailed')}</p>` : ''}
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
    label {
      display: block;
      margin: 0 0 8px;
      font-weight: 600;
    }
    select,
    textarea {
      box-sizing: border-box;
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-md);
      background: var(--app-surface);
      color: var(--app-text);
    }
    select {
      padding: 8px;
    }
    .panels {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    textarea {
      display: block;
      width: 100%;
      min-height: 280px;
      padding: 16px;
      font:
        14px/1.5 ui-monospace,
        monospace;
      resize: vertical;
      overflow-wrap: anywhere;
    }
    textarea:focus-visible,
    select:focus-visible {
      outline: 2px solid var(--app-brand);
      outline-offset: 2px;
    }
    .hint,
    .notice {
      color: var(--app-muted);
      font-size: 0.875rem;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 20px;
    }
    .error {
      padding: 12px;
      border-radius: 8px;
      background: #fee2e2;
      color: #991b1b;
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
      .actions wa-button {
        width: 100%;
      }
    }
  `
}
