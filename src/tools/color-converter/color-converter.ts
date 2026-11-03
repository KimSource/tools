import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import '@awesome.me/webawesome/dist/components/button/button.js'
import { subscribeToLocale, t } from '../../i18n/i18n'
import type { TranslationKey } from '../../i18n/en'
import { copyText } from '../../services/clipboard'
import {
  convertColor,
  type ColorError,
  type ColorFormat,
  type ColorValues,
} from './color-converter.core'

const formats = ['hex', 'rgb', 'hsl'] as const
const labels: Record<
  ColorFormat,
  {
    input: TranslationKey
    convert: TranslationKey
    result: TranslationKey
    copy: TranslationKey
  }
> = {
  hex: {
    input: 'color.hexInput',
    convert: 'color.convertHex',
    result: 'color.hexResult',
    copy: 'color.copyHex',
  },
  rgb: {
    input: 'color.rgbInput',
    convert: 'color.convertRgb',
    result: 'color.rgbResult',
    copy: 'color.copyRgb',
  },
  hsl: {
    input: 'color.hslInput',
    convert: 'color.convertHsl',
    result: 'color.hslResult',
    copy: 'color.copyHsl',
  },
}
const errorKeys: Record<ColorError, TranslationKey> = {
  empty: 'color.errorEmpty',
  invalid: 'color.errorInvalid',
  range: 'color.errorRange',
}

@customElement('color-converter-tool')
export class ColorConverter extends LitElement {
  @state() private inputs: ColorValues = convertColor('hex', '#000000')
  @state() private result: ColorValues | null = convertColor('hex', '#000000')
  @state() private picker = '#000000'
  @state() private error: ColorError | '' = ''
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
  private convert(format: ColorFormat, value: string) {
    this.error = ''
    this.notice = ''
    try {
      const result = convertColor(format, value)
      this.inputs = result
      this.result = result
      this.picker = result.hex
    } catch (error) {
      const message = error instanceof Error ? error.message : 'invalid'
      this.error = (
        ['empty', 'invalid', 'range'].includes(message) ? message : 'invalid'
      ) as ColorError
      this.result = null
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
  render() {
    return html`<section class="tool" aria-labelledby="title">
      <p class="eyebrow">${t('color.eyebrow')}</p>
      <h1 id="title">${t('tools.color.title')}</h1>
      <p class="hint">${t('color.hint')}</p>
      <div class="inputs">
        ${formats.map(
          (format) =>
            html`<div class="row">
              <label for=${format}
                >${t(labels[format].input)}
                <input
                  id=${format}
                  type="text"
                  .value=${this.inputs[format]}
                  @input=${(event: Event) => {
                    this.inputs = {
                      ...this.inputs,
                      [format]: (event.target as HTMLInputElement).value,
                    }
                    this.result = null
                    this.error = ''
                    this.notice = ''
                  }} /></label
              ><wa-button
                @click=${() => this.convert(format, this.inputs[format])}
                >${t(labels[format].convert)}</wa-button
              >
            </div>`,
        )}
      </div>
      ${this.error ? html`<p class="error" role="alert">${t(errorKeys[this.error])}</p>` : ''}
      <div class="picker">
        <label for="picker"
          >${t('color.picker')}<input
            id="picker"
            type="color"
            .value=${this.picker}
            @input=${(event: Event) => this.convert('hex', (event.target as HTMLInputElement).value)}
        /></label>
        ${this.result ? html`<div class="preview" role="img" aria-label=${t('color.preview')} style=${`background-color: ${this.result.hex}`}></div>` : ''}
      </div>
      ${
        this.result
          ? html`<div class="results">
              ${formats.map(
                (format) =>
                  html`<div class="row">
                    <label
                      >${t(labels[format].result)}<input
                        readonly
                        .value=${this.result![format]} /></label
                    ><wa-button @click=${() => this.copy(this.result![format])}
                      >${t(labels[format].copy)}</wa-button
                    >
                  </div>`,
              )}
            </div>`
          : ''
      }
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
    .row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: end;
      gap: 8px;
      margin-top: 12px;
    }
    label {
      display: block;
      font-weight: 600;
      min-width: 0;
    }
    input {
      box-sizing: border-box;
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-md);
      background: var(--app-surface);
      color: var(--app-text);
      padding: 10px;
      font: inherit;
    }
    input[type='text'] {
      display: block;
      width: 100%;
      margin-top: 8px;
    }
    input:focus-visible {
      outline: 2px solid var(--app-brand);
      outline-offset: 2px;
    }
    .picker {
      display: flex;
      align-items: end;
      gap: 16px;
      margin-top: 24px;
    }
    input[type='color'] {
      display: block;
      width: 72px;
      height: 48px;
      margin-top: 8px;
      padding: 4px;
    }
    .preview {
      width: 96px;
      height: 48px;
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-md);
    }
    .results {
      margin-top: 24px;
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
      .row {
        grid-template-columns: 1fr;
      }
    }
  `
}
