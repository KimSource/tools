import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { copyText } from '../../services/clipboard'
import { downloadText } from '../../services/files'
import { transformJson, type JsonOperation } from './json-formatter.core'

@customElement('json-formatter-tool')
export class JsonFormatterTool extends LitElement {
  @state() private input = ''
  @state() private output = ''
  @state() private error = ''
  @state() private indentation: 2 | 4 = 2
  @state() private notice = ''

  private run(operation: JsonOperation) {
    this.error = ''
    this.notice = ''
    try {
      this.output = transformJson(this.input, operation, this.indentation)
    } catch (error) {
      this.output = ''
      this.error =
        error instanceof Error && error.message === 'empty-input'
          ? 'JSON을 입력해주세요.'
          : '올바른 JSON 형식이 아닙니다.'
    }
  }

  private async copy() {
    try {
      await copyText(this.output)
      this.notice = '복사했습니다.'
    } catch {
      this.notice = '복사하지 못했습니다.'
    }
  }

  private download() {
    try {
      downloadText(
        'formatted.json',
        this.output,
        'application/json;charset=utf-8',
      )
      this.notice = '다운로드를 시작했습니다.'
    } catch {
      this.notice = '다운로드하지 못했습니다.'
    }
  }

  render() {
    return html`<section class="tool" aria-labelledby="title">
      <p class="eyebrow">DEVELOPER TOOL</p>
      <h1 id="title">JSON Formatter</h1>
      <label for="input">입력 JSON</label
      ><textarea
        id="input"
        .value=${this.input}
        @input=${(event: Event) => {
          this.input = (event.target as HTMLTextAreaElement).value
          this.output = ''
          this.error = ''
        }}
        placeholder="JSON을 입력하세요"
        spellcheck="false"
      ></textarea>
      <div class="controls">
        <wa-button variant="brand" @click=${() => this.run('format')}
          >Format</wa-button
        ><wa-button @click=${() => this.run('minify')}>Minify</wa-button
        ><label
          >들여쓰기
          <select
            .value=${String(this.indentation)}
            @change=${(event: Event) => {
              this.indentation = Number(
                (event.target as HTMLSelectElement).value,
              ) as 2 | 4
              this.output = ''
              this.notice = ''
            }}
          >
            <option value="2">2칸</option>
            <option value="4">4칸</option>
          </select></label
        ><wa-button
          appearance="outlined"
          @click=${() => {
            this.input = ''
            this.output = ''
            this.error = ''
            this.notice = ''
          }}
          >초기화</wa-button
        >
      </div>
      ${this.error ? html`<p class="error" role="alert">${this.error}</p>` : ''}<label
        for="output"
        >출력</label
      ><textarea
        id="output"
        .value=${this.output}
        readonly
        spellcheck="false"
      ></textarea>
      <div class="result-actions">
        <wa-button ?disabled=${!this.output} @click=${this.copy}
          >결과 복사</wa-button
        ><wa-button ?disabled=${!this.output} @click=${this.download}
          >다운로드</wa-button
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
