import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import '@awesome.me/webawesome/dist/components/button/button.js'
import { getLocale, subscribeToLocale, t } from '../../i18n/i18n'
import { copyText } from '../../services/clipboard'
import { toolStyles } from '../../theme/tool-styles'
import {
  generateHash,
  hashInputByteLength,
  type HashAlgorithm,
} from './hash-generator.core'

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
    const inputSize = new Intl.NumberFormat(getLocale(), {
      style: 'unit',
      unit: 'byte',
      unitDisplay: 'long',
    }).format(hashInputByteLength(this.input))

    return html`<section class="tool" aria-labelledby="title">
      <h1 id="title">${t('tools.hashGenerator.title')}</h1>
      <div class="panels">
        <div>
          <div class="panel-header">
            <label for="input">${t('hash.input')}</label>
            <wa-button
              appearance="plain"
              @click=${() => {
                this.input = ''
                this.invalidate()
              }}
              >${t('actions.reset')}</wa-button
            >
          </div>
          <textarea
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
            <span>UTF-8 · ${inputSize}</span>
            <span id="input-hint">${t('hash.inputHint')}</span>
          </div>
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
              ?disabled=${this.pending}
              @click=${this.run}
              >${t('hash.generate')}</wa-button
            >
          </div>
          ${
            this.failed
              ? html`<p class="error" role="alert">${t('hash.error')}</p>`
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
        margin-top: 10px;
      }
      .input-meta,
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
      select:focus-visible {
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
        .controls {
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
        }
        .generate::part(button) {
          padding-inline: 10px;
        }
      }
      @media (forced-colors: active) {
        select {
          border-color: ButtonText;
        }
      }
    `,
  ]
}
