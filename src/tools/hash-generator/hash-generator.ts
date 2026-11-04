import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import '@awesome.me/webawesome/dist/components/button/button.js'
import { subscribeToLocale, t } from '../../i18n/i18n'
import { copyText } from '../../services/clipboard'
import { generateHash, type HashAlgorithm } from './hash-generator.core'

@customElement('hash-generator-tool')
export class HashGeneratorTool extends LitElement {
  @state() private input = ''
  @state() private algorithm: HashAlgorithm = 'SHA-256'
  @state() private output = ''
  @state() private failed = false
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
    this.failed = false
    this.notice = ''
    this.pending = false
  }

  private async run() {
    this.invalidate()
    const version = this.version
    this.pending = true
    try {
      const output = await generateHash(this.input, this.algorithm)
      if (version === this.version) this.output = output
    } catch {
      if (version === this.version) this.failed = true
    } finally {
      if (version === this.version) this.pending = false
    }
  }

  private async copy() {
    try {
      await copyText(this.output)
      this.notice = 'status.copied'
    } catch {
      this.notice = 'status.copyFailed'
    }
  }

  render() {
    return html`<section class="tool" aria-labelledby="title">
      <p class="eyebrow">${t('hash.eyebrow')}</p>
      <h1 id="title">${t('tools.hashGenerator.title')}</h1>
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
      <div class="panels">
        <div>
          <label for="input">${t('hash.input')}</label>
          <textarea
            id="input"
            .value=${this.input}
            @input=${(event: Event) => {
              this.input = (event.target as HTMLTextAreaElement).value
              this.invalidate()
            }}
            spellcheck="false"
          ></textarea>
          <p class="hint">${t('hash.inputHint')}</p>
        </div>
        <div>
          <label for="output">${t('hash.output')}</label>
          <textarea
            id="output"
            .value=${this.output}
            readonly
            spellcheck="false"
          ></textarea>
        </div>
      </div>
      <div class="actions">
        <wa-button variant="brand" ?disabled=${this.pending} @click=${this.run}
          >${t('hash.generate')}</wa-button
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
      ${this.failed ? html`<p class="error" role="alert">${t('hash.error')}</p>` : ''}
      ${this.notice ? html`<p class="notice" role="status">${t(this.notice)}</p>` : ''}
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
      margin-bottom: 20px;
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
