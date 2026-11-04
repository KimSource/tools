import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import DOMPurify from 'dompurify'
import '@awesome.me/webawesome/dist/components/button/button.js'
import { subscribeToLocale, t } from '../../i18n/i18n'
import { downloadText } from '../../services/files'
import { renderMarkdown } from './markdown-preview.core'

@customElement('markdown-preview-tool')
export class MarkdownPreviewTool extends LitElement {
  @state() private input = ''
  @state() private notice:
    'status.downloadStarted' | 'status.downloadFailed' | '' = ''
  private unsubscribe?: () => void

  connectedCallback() {
    super.connectedCallback()
    this.unsubscribe = subscribeToLocale(() => this.requestUpdate())
  }
  disconnectedCallback() {
    this.unsubscribe?.()
    super.disconnectedCallback()
  }
  private download() {
    try {
      downloadText('markdown.md', this.input, 'text/markdown;charset=utf-8')
      this.notice = 'status.downloadStarted'
    } catch {
      this.notice = 'status.downloadFailed'
    }
  }
  render() {
    const preview = DOMPurify.sanitize(renderMarkdown(this.input), {
      ALLOWED_TAGS: [
        'p',
        'br',
        'hr',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'blockquote',
        'ul',
        'ol',
        'li',
        'strong',
        'em',
        's',
        'a',
        'pre',
        'code',
        'span',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
      ],
      ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class', 'start'],
      ALLOW_DATA_ATTR: false,
    })
    return html`<section class="tool" aria-labelledby="title">
      <h1 id="title">${t('tools.markdown.title')}</h1>
      <p>${t('markdown.policy')}</p>
      <div class="panes">
        <div>
          <label for="input">${t('markdown.input')}</label>
          <textarea
            id="input"
            spellcheck="false"
            .value=${this.input}
            @input=${(event: Event) => {
              this.input = (event.target as HTMLTextAreaElement).value
              this.notice = ''
            }}
          ></textarea>
        </div>
        <section class="preview-pane" aria-labelledby="preview-label">
          <h2 id="preview-label">${t('markdown.preview')}</h2>
          <div class="preview">
            ${this.input ? unsafeHTML(preview) : html`<p>${t('markdown.empty')}</p>`}
          </div>
        </section>
      </div>
      <div class="actions">
        <wa-button ?disabled=${!this.input} @click=${this.download}
          >${t('actions.download')}</wa-button
        >
        <wa-button
          @click=${() => {
            this.input = ''
            this.notice = ''
          }}
          >${t('actions.reset')}</wa-button
        >
        ${this.notice ? html`<span role="status">${t(this.notice)}</span>` : ''}
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
    h1 {
      margin: 0 0 20px;
    }
    p {
      line-height: 1.5;
    }
    .panes {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 16px;
    }
    label,
    h2 {
      display: block;
      font-size: 1rem;
      font-weight: 600;
      margin: 16px 0 8px;
    }
    textarea,
    .preview {
      box-sizing: border-box;
      width: 100%;
      min-height: 320px;
      padding: 16px;
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-md);
      background: var(--app-surface);
      color: var(--app-text);
    }
    textarea {
      font:
        14px/1.5 ui-monospace,
        monospace;
      resize: vertical;
    }
    textarea:focus-visible,
    a:focus-visible {
      outline: 2px solid var(--app-brand);
      outline-offset: 2px;
    }
    .preview {
      overflow-x: auto;
      line-height: 1.6;
      overflow-wrap: anywhere;
    }
    .preview pre {
      overflow-x: auto;
      padding: 12px;
      background: var(--app-brand-soft);
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-md);
    }
    .preview table {
      border-collapse: collapse;
      display: block;
      overflow-x: auto;
    }
    .preview th,
    .preview td {
      border: 1px solid var(--app-border);
      padding: 6px 10px;
    }
    .preview a {
      color: var(--app-brand);
    }
    .preview .hljs-keyword,
    .preview .hljs-selector-tag,
    .preview .hljs-literal {
      color: var(--app-brand);
      font-weight: bold;
    }
    .preview .hljs-string,
    .preview .hljs-attr,
    .preview .hljs-number {
      text-decoration: underline;
      text-decoration-color: var(--app-brand);
    }
    .preview .hljs-comment {
      color: var(--app-muted);
      font-style: italic;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
    }
    @media (max-width: 700px) {
      .tool {
        padding: 16px;
      }
      .panes {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `
}
