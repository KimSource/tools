import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import '@awesome.me/webawesome/dist/components/button/button.js'
import { subscribeToLocale, t } from '../../i18n/i18n'
import { copyText } from '../../services/clipboard'
import { toolStyles } from '../../theme/tool-styles'
import { transformUrl, type UrlOperation } from './url-encoder.core'

const operations = ['encode', 'decode', 'query'] as const

@customElement('url-encoder-tool')
export class UrlEncoderTool extends LitElement {
  @state() private operation: UrlOperation = 'encode'
  @state() private input = ''
  @state() private output = ''
  @state() private error: 'empty' | 'invalid' | '' = ''
  @state() private notice:
    'url.converted' | 'status.copied' | 'status.copyFailed' | '' = ''
  private version = 0
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
    this.version++
    this.output = ''
    this.error = ''
    this.notice = ''
  }
  private run() {
    this.invalidate()
    try {
      this.output = transformUrl(this.input, this.operation)
      this.notice = 'url.converted'
    } catch (error) {
      this.error =
        error instanceof Error && error.message === 'empty-input'
          ? 'empty'
          : 'invalid'
    }
  }
  private selectOperation(operation: UrlOperation) {
    if (this.operation === operation) return
    this.operation = operation
    this.invalidate()
  }
  private reset() {
    this.input = ''
    this.invalidate()
    this.renderRoot.querySelector<HTMLTextAreaElement>('#input')?.focus()
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
  render() {
    const operation = this.operation
    const notice = this.notice ? t(this.notice) : ''
    return html`<section class="tool" aria-labelledby="title">
      <h1 id="title">${t('tools.urlEncoder.title')}</h1>
      <div class="modes" role="group" aria-label=${t('url.mode')}>
        ${operations.map(
          (mode) =>
            html`<button
              type="button"
              aria-pressed=${operation === mode}
              @click=${() => this.selectOperation(mode)}
            >
              <span aria-hidden="true" ?hidden=${operation !== mode}>✓</span>
              ${t(`url.${mode}`)}
            </button>`,
        )}
      </div>
      <div class="panels">
        <div>
          <div class="panel-header">
            <label for="input">${t(`url.${operation}Input`)}</label>
            <wa-button appearance="plain" @click=${this.reset}
              >${t('actions.reset')}</wa-button
            >
          </div>
          <textarea
            id="input"
            .value=${this.input}
            placeholder=${t(`url.${operation}Placeholder`)}
            aria-describedby="input-hint"
            @input=${(event: Event) => {
              this.input = (event.target as HTMLTextAreaElement).value
              this.invalidate()
            }}
            spellcheck="false"
          ></textarea>
          <p id="input-hint" class="hint">${t(`url.${operation}Hint`)}</p>
          <wa-button class="transform" variant="brand" @click=${this.run}
            >${t('url.transform')}</wa-button
          >
          <p class="error" role="alert" ?hidden=${!this.error}>
            ${
              this.error
                ? t(
                    this.error === 'empty'
                      ? 'url.errorEmpty'
                      : `url.${operation}Invalid`,
                  )
                : ''
            }
          </p>
        </div>
        <div>
          <div class="panel-header">
            <label for="output">${t(`url.${operation}Output`)}</label>
            <wa-button ?disabled=${!this.output} @click=${this.copy}
              >${t('actions.copy')}</wa-button
            >
          </div>
          <textarea
            id="output"
            .value=${this.output}
            placeholder=${t('url.outputPlaceholder')}
            readonly
            spellcheck="false"
          ></textarea>
          <p class="notice" role="status">${notice}</p>
        </div>
      </div>
    </section>`
  }
  static styles = [
    toolStyles,
    css`
      h1 {
        margin-bottom: 24px;
      }
      .modes {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
      }
      .modes button {
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
      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 8px;
      }
      .panel-header label {
        margin: 0;
      }
      .panel-header wa-button::part(button) {
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
      .hint,
      .notice {
        margin: 10px 0 0;
        color: var(--tool-muted);
        font-size: 0.875rem;
        line-height: 1.5;
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
        .modes {
          gap: 6px;
        }
        .modes button {
          padding-inline: 6px;
          font-size: 0.875rem;
        }
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
