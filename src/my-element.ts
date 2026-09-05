import '@awesome.me/webawesome/dist/styles/webawesome.css'
import '@awesome.me/webawesome/dist/components/button/button.js'
import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { navigate, parseHash, subscribeToRoute, type Route } from './app/router'
import { getTool, toolRegistry } from './app/tool-registry'

@customElement('app-shell')
export class AppShell extends LitElement {
  private route: Route = parseHash(window.location.hash)
  private loading = false
  private failed = false
  private unsubscribe?: () => void
  connectedCallback() {
    super.connectedCallback()
    this.unsubscribe = subscribeToRoute((route) => {
      this.route = route
      void this.loadTool(route)
      this.requestUpdate()
    })
  }
  disconnectedCallback() {
    this.unsubscribe?.()
    super.disconnectedCallback()
  }
  private async loadTool(route: Route) {
    if (route.kind !== 'tool') return
    const tool = getTool(route.id)
    if (!tool) return
    this.loading = true
    this.failed = false
    try {
      await tool.load()
    } catch {
      if (this.route.kind === 'tool' && this.route.id === route.id)
        this.failed = true
    } finally {
      if (this.route.kind === 'tool' && this.route.id === route.id)
        this.loading = false
      this.requestUpdate()
    }
  }
  private renderMain() {
    if (this.route.kind === 'home')
      return html`<section class="intro">
        <p class="eyebrow">ON-DEVICE UTILITIES</p>
        <h1>작업에 필요한 작은 도구들</h1>
        <p class="description">
          브라우저 안에서 안전하게 처리하는 개인용 도구 모음입니다.
        </p>
        <h2>도구</h2>
        <div class="tool-grid">
          ${toolRegistry.map(
            (tool) =>
              html`<article class="tool-card">
                <span class="tool-icon">{ }</span>
                <h3>${tool.id}</h3>
                <p>${tool.descriptionKey}</p>
                <wa-button variant="brand" @click=${() => navigate(tool.id)}
                  >열기</wa-button
                >
              </article>`,
          )}
        </div>
      </section>`
    if (this.route.kind === 'not-found')
      return html`<h1>페이지를 찾을 수 없습니다</h1>
        <wa-button @click=${() => navigate('')}>홈으로</wa-button>`
    const tool = getTool(this.route.id)
    if (!tool)
      return html`<h1>도구를 찾을 수 없습니다</h1>
        <wa-button @click=${() => navigate('')}>홈으로</wa-button>`
    if (this.loading) return html`<h1>불러오는 중…</h1>`
    if (this.failed)
      return html`<h1>도구를 불러오지 못했습니다</h1>
        <wa-button @click=${() => void this.loadTool(this.route)}
          >다시 시도</wa-button
        >`
    return html`<json-formatter-tool></json-formatter-tool>`
  }
  render() {
    return html`<header class="header">
        <a class="brand" href="/tools/">Local Tools</a>
        <div class="actions">
          <wa-button appearance="outlined" size="small">한국어</wa-button
          ><wa-button appearance="outlined" size="small">테마</wa-button>
        </div>
      </header>
      <main class="main">${this.renderMain()}</main>`
  }
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      color: var(--app-text);
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--app-space-4) var(--app-space-6);
      border-bottom: 1px solid var(--app-border);
    }
    .brand {
      color: inherit;
      font-size: 1.125rem;
      font-weight: 700;
      text-decoration: none;
    }
    .actions {
      display: flex;
      gap: var(--app-space-2);
    }
    .main {
      width: min(1120px, calc(100% - 48px));
      margin: 0 auto;
      padding: 72px 0;
    }
    .intro {
      max-width: 800px;
    }
    .eyebrow {
      color: var(--app-brand);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.12em;
    }
    h1 {
      margin: 12px 0 16px;
      font-size: clamp(2.25rem, 6vw, 4.5rem);
      line-height: 1.05;
      letter-spacing: -0.05em;
    }
    h2 {
      margin-top: 56px;
    }
    .description,
    .tool-card p {
      color: var(--app-muted);
    }
    .tool-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: var(--app-space-4);
    }
    .tool-card {
      padding: 24px;
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-lg);
      background: var(--app-surface);
      box-shadow: var(--app-shadow);
    }
    .tool-icon {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border-radius: var(--app-radius-md);
      background: var(--app-brand-soft);
      color: var(--app-brand);
      font-family: ui-monospace, monospace;
    }
  `
}
declare global {
  interface HTMLElementTagNameMap {
    'app-shell': AppShell
  }
}
