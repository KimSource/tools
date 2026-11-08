import { LitElement, css, html } from 'lit'
import { toolStyles } from '../../theme/tool-styles'
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
  @state() private error: 'error.emptyInput' | 'error.invalidJson' | '' = ''
  @state() private indentation: 2 | 4 = 2
  @state() private notice:
    | 'status.copied'
    | 'status.copyFailed'
    | 'status.downloadStarted'
    | 'status.downloadFailed'
    | '' = ''
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
          ? 'error.emptyInput'
          : 'error.invalidJson'
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

  private download() {
    try {
      downloadText(
        'formatted.json',
        this.output,
        'application/json;charset=utf-8',
      )
      this.notice = 'status.downloadStarted'
    } catch {
      this.notice = 'status.downloadFailed'
    }
  }

  render() {
    return html`<section class="tool" aria-labelledby="title">
      <h1 id="title">${t('tools.jsonFormatter.title')}</h1>
      <p class="description">${t('tools.jsonFormatter.description')}</p>
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
        ><wa-select
          label=${t('json.indent')}
          size="s"
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
        ><wa-button
          appearance="plain"
          @click=${() => {
            this.input = ''
            this.output = ''
            this.error = ''
            this.notice = ''
          }}
          >${t('actions.reset')}</wa-button
        >
      </div>
      ${this.error ? html`<p class="error" role="alert">${t(this.error)}</p>` : ''}<label
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
        >${this.notice ? html`<span role="status">${t(this.notice)}</span>` : ''}
      </div>
    </section>`
  }

  static styles = [
    toolStyles,
    css`
      .controls,
      .result-actions {
        display: flex;
        align-items: flex-end;
        flex-wrap: wrap;
        gap: 12px;
        margin: 20px 0 36px;
      }
      .result-actions {
        align-items: center;
        margin-bottom: 0;
      }
      .controls wa-select {
        width: 160px;
      }
      @media (max-width: 600px) {
        .controls,
        .result-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        wa-button {
          width: 100%;
          min-width: 0;
        }
        .controls wa-select {
          width: 100%;
          min-width: 0;
        }
        .result-actions span {
          grid-column: 1 / -1;
        }
      }
    `,
  ]
}
