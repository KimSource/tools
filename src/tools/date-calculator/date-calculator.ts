import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import '@awesome.me/webawesome/dist/components/button/button.js'
import { subscribeToLocale, t } from '../../i18n/i18n'
import type { TranslationKey } from '../../i18n/en'
import { copyText } from '../../services/clipboard'
import {
  calculateDate,
  dateDifference,
  type Amounts,
  type DateError,
} from './date-calculator.core'

@customElement('date-calculator-tool')
export class DateCalculator extends LitElement {
  @state() private mode: 'difference' | 'adjust' = 'difference'
  @state() private start = ''
  @state() private end = ''
  @state() private base = ''
  @state() private include = false
  @state() private operation: 'add' | 'subtract' = 'add'
  @state() private amounts: Amounts = {
    years: '0',
    months: '0',
    weeks: '0',
    days: '0',
  }
  @state() private difference: ReturnType<typeof dateDifference> | null = null
  @state() private dateResult = ''
  @state() private error: DateError | '' = ''
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
  private clear() {
    this.difference = null
    this.dateResult = ''
    this.error = ''
    this.notice = ''
  }
  private calculate() {
    this.clear()
    try {
      if (this.mode === 'difference')
        this.difference = dateDifference(this.start, this.end, this.include)
      else
        this.dateResult = calculateDate(this.base, this.amounts, this.operation)
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'invalid'
      this.error = (
        ['empty', 'invalid', 'range', 'amount'].includes(reason)
          ? reason
          : 'invalid'
      ) as DateError
    }
  }
  private resultText(): string {
    if (this.dateResult) return this.dateResult
    if (!this.difference) return ''
    const { total, weeks, days, direction } = this.difference
    return `${total} ${t('date.days')} (${weeks} ${t('date.weeks')} ${days} ${t('date.days')}) · ${t(direction < 0 ? 'date.before' : direction > 0 ? 'date.after' : 'date.same')} · ${t(this.include ? 'date.included' : 'date.excluded')}`
  }
  private setAmount(key: keyof Amounts, event: Event) {
    this.amounts = {
      ...this.amounts,
      [key]: (event.target as HTMLInputElement).value,
    }
    this.clear()
  }
  private async copy() {
    try {
      await copyText(this.resultText())
      this.notice = 'copied'
    } catch {
      this.notice = 'failed'
    }
  }
  private dateInput(
    label: TranslationKey,
    value: string,
    update: (value: string) => void,
  ) {
    return html`<label
      >${t(label)}<input
        type="text"
        inputmode="numeric"
        placeholder="YYYY-MM-DD"
        .value=${value}
        @input=${(event: Event) => {
          update((event.target as HTMLInputElement).value)
          this.clear()
        }}
    /></label>`
  }
  render() {
    const errorKeys: Record<DateError, TranslationKey> = {
      empty: 'date.empty',
      invalid: 'date.invalid',
      range: 'date.range',
      amount: 'date.amount',
    }
    const result = this.resultText()
    return html`<section class="tool" aria-labelledby="title">
      <h1 id="title">${t('tools.dateCalculator.title')}</h1>
      <p class="hint">${t('date.hint')}</p>
      <label
        >${t('date.mode')}<select
          .value=${this.mode}
          @change=${(event: Event) => {
            this.mode = (event.target as HTMLSelectElement)
              .value as typeof this.mode
            this.clear()
          }}
        >
          <option value="difference">${t('date.difference')}</option>
          <option value="adjust">${t('date.adjust')}</option>
        </select></label
      >
      ${
        this.mode === 'difference'
          ? html`
              <div class="grid">
                ${this.dateInput('date.start', this.start, (value) => {
                  this.start = value
                })}${this.dateInput('date.end', this.end, (value) => {
                  this.end = value
                })}
              </div>
              <label class="check"
                ><input
                  type="checkbox"
                  .checked=${this.include}
                  @change=${(event: Event) => {
                    this.include = (event.target as HTMLInputElement).checked
                    this.clear()
                  }}
                />${t('date.include')}</label
              >
            `
          : html`
              ${this.dateInput('date.base', this.base, (value) => {
                this.base = value
              })}
              <label
                >${t('date.operation')}<select
                  .value=${this.operation}
                  @change=${(event: Event) => {
                    this.operation = (event.target as HTMLSelectElement)
                      .value as typeof this.operation
                    this.clear()
                  }}
                >
                  <option value="add">${t('date.add')}</option>
                  <option value="subtract">${t('date.subtract')}</option>
                </select></label
              >
              <div class="units">
                ${(['years', 'months', 'weeks', 'days'] as const).map(
                  (key) =>
                    html`<label
                      >${t(`date.${key}`)}<input
                        type="number"
                        min="0"
                        max="9999"
                        step="1"
                        .value=${this.amounts[key]}
                        @input=${(event: Event) => this.setAmount(key, event)}
                    /></label>`,
                )}
              </div>
              <p class="hint">${t('date.amountHint')}</p>
              <p class="hint">${t('date.rule')}</p>
            `
      }
      <wa-button variant="brand" @click=${this.calculate}
        >${t('date.calculate')}</wa-button
      >
      ${this.error ? html`<p class="error" role="alert">${t(errorKeys[this.error])}</p>` : ''}
      ${
        result
          ? html`<div class="result">
              <label
                >${t('date.result')}<input readonly .value=${result} /></label
              ><wa-button @click=${this.copy}>${t('date.copy')}</wa-button>
            </div>`
          : ''
      }
      ${this.notice ? html`<p role="status">${t(this.notice === 'copied' ? 'status.copied' : 'status.copyFailed')}</p>` : ''}
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
    label {
      display: block;
      margin: 16px 0;
      font-weight: 600;
    }
    input:not([type='checkbox']),
    select {
      display: block;
      box-sizing: border-box;
      width: 100%;
      margin-top: 8px;
      padding: 10px;
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-md);
      background: var(--app-surface);
      color: var(--app-text);
      font: inherit;
    }
    input:focus-visible,
    select:focus-visible {
      outline: 2px solid var(--app-brand);
      outline-offset: 2px;
    }
    .grid,
    .units {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    .units {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    .check {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .hint {
      color: var(--app-muted);
      font-size: 0.875rem;
    }
    .error {
      color: var(--app-text);
      border: 1px solid var(--app-border);
      padding: 12px;
    }
    .result {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 8px;
    }
    @media (max-width: 700px) {
      .tool {
        padding: 16px;
      }
      .grid,
      .units {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .result {
        grid-template-columns: 1fr;
      }
    }
  `
}
