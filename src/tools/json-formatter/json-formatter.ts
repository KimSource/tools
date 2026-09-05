import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { copyText } from '../../services/clipboard'
import { downloadText } from '../../services/files'
import { transformJson, type JsonOperation } from './json-formatter.core'
import { subscribeToLocale, t } from '../../i18n/i18n'
import '@awesome.me/webawesome/dist/components/select/select.js'
import '@awesome.me/webawesome/dist/components/option/option.js'

@customElement('json-formatter-tool')
export class JsonFormatterTool extends LitElement {
  @state() private input = ''
  @state() private output = ''
  @state() private error = ''
  @state() private indentation: 2 | 4 = 2
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

  private run(operation: JsonOperation) {
    this.error = ''
    this.notice = ''
    try {
      this.output = transformJson(this.input, operation, this.indentation)
    } catch (error) {
      this.output = ''
      this.error =
        error instanceof Error && error.message === 'empty-input'
          ? t('error.emptyInput')
          : t('error.invalidJson')
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
        'formatted.json',
        this.output,
        'application/json;charset=utf-8',
      )
      this.notice = t('status.downloadStarted')
    } catch {
      this.notice = t('status.downloadFailed')
    }
  }

  render() {
    return html`<section class="tool" aria-labelledby="title">
      <p class="eyebrow">${t('json.eyebrow')}</p>
      <h1 id="title">${t('tools.jsonFormatter.title')}</h1>
      <label for="input">${t('json.inputLabel')}</label
      ><textarea
        id="input"
        .value=${this.input}
        @input=${(event: Event) => {
          this.input = (event.target as HTMLTextAreaElement).value
          this.output = ''
          this.error = ''
        }}
        placeholder=${t('json.inputPlaceholder')}
        spellcheck="false"
      ></textarea>
      <div class="controls">
        <wa-button variant="brand" @click=${() => this.run('format')}
          >${t('actions.format')}</wa-button
        ><wa-button @click=${() => this.run('minify')}
          >${t('actions.minify')}</wa-button
        ><label
          >${t('json.indent')}
          <wa-select
            label=${t('json.indent')}
            size="small"
            .value=${String(this.indentation)}
            @change=${(event: Event) => {
              this.indentation = Number(
                (event.target as HTMLElement & { value: string }).value,
              ) as 2 | 4
              this.output = ''
              this.notice = ''
            }}
            ><wa-option value="2">${t('json.indent2')}</wa-option
            ><wa-option value="4">${t('json.indent4')}</wa-option></wa-select
          ></label
        ><wa-button
          appearance="outlined"
          @click=${() => {
            this.input = ''
            this.output = ''
            this.error = ''
            this.notice = ''
          }}
          >${t('actions.reset')}</wa-button
        >
      </div>
      ${this.error ? html`<p class="error" role="alert">${this.error}</p>` : ''}<label
        for="output"
        >${t('json.outputLabel')}</label
      ><textarea
        id="output"
        .value=${this.output}
        readonly
        spellcheck="false"
      ></textarea>
      <div class="result-actions">
        <wa-button ?disabled=${!this.output} @click=${this.copy}
          >${t('actions.copy')}</wa-button
        ><wa-button ?disabled=${!this.output} @click=${this.download}
          >${t('actions.download')}</wa-button
        >${this.notice ? html`<span role="status">${this.notice}</span>` : ''}
      </div>
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
      margin: 12px 0 28px;
    }
    label {
      display: block;
      margin: 16px 0 8px;
      font-weight: 600;
    }
    textarea {
      display: block;
      box-sizing: border-box;
      width: 100%;
      min-height: 220px;
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
    textarea:focus-visible,
    select:focus-visible {
      outline: 2px solid var(--app-brand);
      outline-offset: 2px;
    }
    .controls,
    .result-actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin: 16px 0;
    }
    .controls label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-weight: 400;
    }
    .controls select {
      padding: 8px;
      border: 1px solid var(--app-border);
      border-radius: 8px;
      background: var(--app-surface);
      color: var(--app-text);
    }
    wa-select::part(form-control-label) {
      color: var(--app-text);
    }
    wa-select::part(combobox),
    wa-select::part(display-input),
    wa-select::part(listbox) {
      background: var(--app-surface);
      color: var(--app-text);
    }
    wa-option {
      --wa-color-neutral-fill-normal: var(--app-surface);
      --wa-color-neutral-on-normal: var(--app-text);
      --wa-form-control-activated-color: var(--app-brand);
      --wa-color-brand-on-loud: #fff;
      color: var(--app-text);
    }
    wa-option::part(label) {
      color: var(--app-text);
    }
    wa-option[aria-selected='true']::part(label) {
      color: #fff;
    }
    .error {
      padding: 12px;
      border-radius: 8px;
      background: #fee2e2;
      color: #991b1b;
    }
    .result-actions span {
      color: var(--app-muted);
      font-size: 0.9rem;
    }
    @media (max-width: 600px) {
      .tool {
        padding: 20px;
      }
      .controls wa-button {
        flex: 1;
      }
    }
  `
}
