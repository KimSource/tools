import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import '@awesome.me/webawesome/dist/components/button/button.js'
import { subscribeToLocale, t, getLocale } from '../../i18n/i18n'
import { copyText } from '../../services/clipboard'
import {
  dateToMilliseconds,
  formatTimestampSeconds,
  timestampToMilliseconds,
  type ConversionError,
  type Unit,
} from './unix-timestamp-converter.core'
import type { TranslationKey } from '../../i18n/en'

@customElement('unix-timestamp-converter-tool')
export class UnixTimestampConverter extends LitElement {
  @state() private timestamp = ''
  @state() private date = ''
  @state() private unit: Unit = 'auto'
  @state() private result: number | null = null
  @state() private error: ConversionError | '' = ''
  @state() private detected: 'seconds' | 'milliseconds' | '' = ''
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
  private clearResult() {
    this.result = null
    this.error = ''
    this.detected = ''
    this.notice = ''
  }
  private convert(source: 'timestamp' | 'date') {
    this.clearResult()
    try {
      this.result =
        source === 'timestamp'
          ? timestampToMilliseconds(this.timestamp, this.unit)
          : dateToMilliseconds(this.date)
      if (source === 'timestamp' && this.unit === 'auto')
        this.detected =
          this.timestamp.trim().replace(/^[+-]/, '').length === 10
            ? 'seconds'
            : 'milliseconds'
    } catch (error) {
      const message = error instanceof Error ? error.message : 'invalid'
      this.error = (
        ['empty', 'invalid', 'ambiguous', 'range'].includes(message)
          ? message
          : 'invalid'
      ) as ConversionError
    }
  }
  private async copy(value: string) {
    try {
      await copyText(value)
      this.notice = 'copied'
    } catch {
      this.notice = 'failed'
    }
  }
  private resultRow(
    label: TranslationKey,
    copyLabel: TranslationKey,
    value: string,
  ) {
    return html`<div class="result">
      <label>${t(label)}<input readonly .value=${value} /></label
      ><wa-button @click=${() => this.copy(value)}>${t(copyLabel)}</wa-button>
    </div>`
  }
  render() {
    const date = this.result === null ? null : new Date(this.result)
    const errorKeys: Record<ConversionError, TranslationKey> = {
      empty: 'timestamp.errorEmpty',
      invalid: 'timestamp.errorInvalid',
      ambiguous: 'timestamp.errorAmbiguous',
      range: 'timestamp.errorRange',
    }
    return html`<section class="tool" aria-labelledby="title">
      <p class="eyebrow">${t('timestamp.eyebrow')}</p>
      <h1 id="title">${t('tools.timestamp.title')}</h1>
      <div class="panels">
        <div>
          <label for="timestamp">${t('timestamp.timestamp')}</label
          ><input
            id="timestamp"
            type="text"
            inputmode="decimal"
            .value=${this.timestamp}
            @input=${(e: Event) => {
              this.timestamp = (e.target as HTMLInputElement).value
              this.clearResult()
            }}
          />
          <label for="unit">${t('timestamp.unit')}</label
          ><select
            id="unit"
            .value=${this.unit}
            @change=${(e: Event) => {
              this.unit = (e.target as HTMLSelectElement).value as Unit
              this.clearResult()
            }}
          >
            <option value="auto">${t('timestamp.auto')}</option>
            <option value="seconds">${t('timestamp.seconds')}</option>
            <option value="milliseconds">${t('timestamp.milliseconds')}</option>
          </select>
          <p class="hint">${t('timestamp.autoHint')}</p>
          <wa-button variant="brand" @click=${() => this.convert('timestamp')}
            >${t('timestamp.fromTimestamp')}</wa-button
          >
        </div>
        <div>
          <label for="date">${t('timestamp.date')}</label
          ><input
            id="date"
            type="text"
            placeholder="2024-01-01T12:00:00+09:00"
            .value=${this.date}
            @input=${(e: Event) => {
              this.date = (e.target as HTMLInputElement).value
              this.clearResult()
            }}
          />
          <p class="hint">${t('timestamp.dateHint')}</p>
          <wa-button variant="brand" @click=${() => this.convert('date')}
            >${t('timestamp.fromDate')}</wa-button
          >
        </div>
      </div>
      <div class="actions">
        <wa-button
          @click=${() => {
            const now = Date.now()
            this.timestamp = String(now)
            this.unit = 'milliseconds'
            this.date = new Date(now).toISOString()
            this.clearResult()
            this.result = now
          }}
          >${t('timestamp.now')}</wa-button
        >
      </div>
      ${this.error ? html`<p class="error" role="alert">${t(errorKeys[this.error])}</p>` : ''}
      ${this.detected ? html`<p class="hint" role="status">${t(this.detected === 'seconds' ? 'timestamp.detectedSeconds' : 'timestamp.detectedMilliseconds')}</p>` : ''}
      ${date && this.result !== null ? html`<div class="results">${this.resultRow('timestamp.seconds', 'timestamp.copySeconds', formatTimestampSeconds(this.result))}${this.resultRow('timestamp.milliseconds', 'timestamp.copyMilliseconds', String(this.result))}${this.resultRow('timestamp.utc', 'timestamp.copyUtc', date.toISOString().replace('T', ' ').replace('Z', ' UTC'))}${this.resultRow('timestamp.local', 'timestamp.copyLocal', date.toLocaleString(getLocale(), { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3, timeZoneName: 'long' }))}${this.resultRow('timestamp.iso', 'timestamp.copyIso', date.toISOString())}</div>` : ''}
      ${this.notice ? html`<p class="hint" role="status">${t(this.notice === 'copied' ? 'status.copied' : 'status.copyFailed')}</p>` : ''}
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
    .panels {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 24px;
    }
    label {
      display: block;
      margin: 12px 0 8px;
      font-weight: 600;
    }
    input,
    select {
      box-sizing: border-box;
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-md);
      background: var(--app-surface);
      color: var(--app-text);
      padding: 10px;
      font: inherit;
    }
    input {
      display: block;
      width: 100%;
      margin-top: 8px;
    }
    input:focus-visible,
    select:focus-visible {
      outline: 2px solid var(--app-brand);
      outline-offset: 2px;
    }
    .hint {
      color: var(--app-muted);
      font-size: 0.875rem;
    }
    .actions {
      margin-top: 24px;
    }
    .results {
      margin-top: 24px;
    }
    .result {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: end;
      gap: 8px;
    }
    .result label {
      min-width: 0;
      margin: 8px 0 0;
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
      .result {
        grid-template-columns: 1fr;
      }
    }
  `
}
