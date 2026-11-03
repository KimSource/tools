import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import '@awesome.me/webawesome/dist/components/button/button.js'
import { subscribeToLocale, t } from '../../i18n/i18n'
import { copyText } from '../../services/clipboard'
import {
  characterSets,
  generateStrings,
  type CharacterKind,
  type RandomError,
} from './random-string-generator.core'

const kinds = Object.keys(characterSets) as CharacterKind[]
const labels = {
  lowercase: 'random.lowercase',
  uppercase: 'random.uppercase',
  digits: 'random.digits',
  special: 'random.special',
} as const
const errors = {
  length: 'random.errorLength',
  count: 'random.errorCount',
  types: 'random.errorTypes',
  short: 'random.errorShort',
  random: 'random.errorRandom',
} as const

@customElement('random-string-generator-tool')
export class RandomStringGenerator extends LitElement {
  @state() private length = '16'
  @state() private count = '1'
  @state() private selected: CharacterKind[] = [
    'lowercase',
    'uppercase',
    'digits',
  ]
  @state() private exclude = false
  @state() private requireEach = false
  @state() private output = ''
  @state() private error: RandomError | '' = ''
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
      this.output = generateStrings({
        length: this.length.trim() ? Number(this.length) : NaN,
        count: this.count.trim() ? Number(this.count) : NaN,
        kinds: this.selected,
        excludeAmbiguous: this.exclude,
        requireEach: this.requireEach,
      }).join('\n')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'random'
      this.error = (
        Object.hasOwn(errors, message) ? message : 'random'
      ) as RandomError
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
      <p class="eyebrow">${t('random.eyebrow')}</p>
      <h1 id="title">${t('tools.random.title')}</h1>
      <p class="hint">${t('random.hint')}</p>
      <div class="numbers">
        <div>
          <label for="length">${t('random.length')}</label
          ><input
            id="length"
            type="number"
            min="1"
            max="256"
            step="1"
            .value=${this.length}
            aria-invalid=${this.error === 'length' || this.error === 'short'}
            aria-describedby=${this.error === 'length' || this.error === 'short' ? 'length-error' : ''}
            @input=${(event: Event) => {
              this.length = (event.target as HTMLInputElement).value
              this.invalidate()
            }}
          />
          ${this.error === 'length' || this.error === 'short' ? html`<p id="length-error" class="error" role="alert">${t(errors[this.error])} ${this.error === 'short' ? this.selected.length : ''}</p>` : ''}
        </div>
        <div>
          <label for="count">${t('random.count')}</label
          ><input
            id="count"
            type="number"
            min="1"
            max="100"
            step="1"
            .value=${this.count}
            aria-invalid=${this.error === 'count'}
            aria-describedby=${this.error === 'count' ? 'count-error' : ''}
            @input=${(event: Event) => {
              this.count = (event.target as HTMLInputElement).value
              this.invalidate()
            }}
          />
          ${this.error === 'count' ? html`<p id="count-error" class="error" role="alert">${t(errors.count)}</p>` : ''}
        </div>
      </div>
      <fieldset aria-describedby="types-hint">
        <legend>${t('random.types')}</legend>
        ${kinds.map(
          (kind) =>
            html`<label class="check"
              ><input
                type="checkbox"
                .checked=${this.selected.includes(kind)}
                @change=${(event: Event) => {
                  const checked = (event.target as HTMLInputElement).checked
                  this.selected = checked
                    ? [...this.selected, kind]
                    : this.selected.filter((item) => item !== kind)
                  this.invalidate()
                }}
              />${t(labels[kind])}${kind === 'special' ? html` <code>${characterSets.special}</code>` : ''}</label
            >`,
        )}
        <span id="types-hint" class="hint"
          >${this.error === 'types' ? html`<span class="error" role="alert">${t(errors.types)}</span>` : ''}</span
        >
      </fieldset>
      <label class="check"
        ><input
          type="checkbox"
          .checked=${this.exclude}
          @change=${(event: Event) => {
            this.exclude = (event.target as HTMLInputElement).checked
            this.invalidate()
          }}
        />${t('random.exclude')}</label
      >
      <label class="check"
        ><input
          type="checkbox"
          .checked=${this.requireEach}
          @change=${(event: Event) => {
            this.requireEach = (event.target as HTMLInputElement).checked
            this.invalidate()
          }}
        />${t('random.require')}</label
      >
      <div class="actions">
        <wa-button variant="brand" @click=${this.run}
          >${t('random.generate')}</wa-button
        ><wa-button ?disabled=${!this.output} @click=${this.copy}
          >${t('actions.copy')}</wa-button
        >
      </div>
      ${this.error === 'random' ? html`<p class="error" role="alert">${t(errors.random)}</p>` : ''}
      <label for="output">${t('random.output')}</label
      ><textarea
        id="output"
        readonly
        spellcheck="false"
        .value=${this.output}
      ></textarea>
      <p class="hint">${t('random.copyHint')}</p>
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
    .hint {
      color: var(--app-muted);
      font-size: 0.875rem;
      line-height: 1.5;
    }
    .numbers {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      margin: 24px 0;
    }
    label,
    legend {
      font-weight: 600;
    }
    input[type='number'],
    textarea {
      box-sizing: border-box;
      display: block;
      width: 100%;
      margin-top: 8px;
      padding: 10px;
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-md);
      background: var(--app-surface);
      color: var(--app-text);
      font: inherit;
    }
    fieldset {
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-md);
      margin: 0 0 20px;
      padding: 12px;
    }
    .check {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 8px;
      margin: 12px 0;
    }
    code {
      overflow-wrap: anywhere;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 24px 0;
    }
    textarea {
      min-height: 180px;
      font:
        14px/1.5 ui-monospace,
        monospace;
      resize: vertical;
      overflow-wrap: anywhere;
    }
    input:focus-visible,
    textarea:focus-visible {
      outline: 2px solid var(--app-brand);
      outline-offset: 2px;
    }
    .error {
      color: var(--app-text);
      border-left: 3px solid #c33;
      padding-left: 8px;
    }
    @media (max-width: 700px) {
      .tool {
        padding: 16px;
      }
      .numbers {
        grid-template-columns: 1fr;
      }
    }
  `
}
