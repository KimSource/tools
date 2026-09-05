import '@awesome.me/webawesome/dist/styles/webawesome.css'
import '@awesome.me/webawesome/dist/components/button/button.js'
import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { navigate, parseHash, subscribeToRoute, type Route } from './app/router'

@customElement('app-shell')
export class AppShell extends LitElement {
  private route: Route = parseHash(window.location.hash)
  private unsubscribeFromRoute?: () => void

  connectedCallback() {
    super.connectedCallback()
    this.unsubscribeFromRoute = subscribeToRoute((route) => {
      this.route = route
      this.requestUpdate()
    })
  }

  disconnectedCallback() {
    this.unsubscribeFromRoute?.()
    super.disconnectedCallback()
  }

  render() {
    const isHome = this.route.kind === 'home'
    return html`
      <header class="header">
        <a class="brand" href="/tools/" aria-label="Local Tools home"
          >Local Tools</a
        >
        <div class="actions">
          <wa-button appearance="outlined" size="small">한국어</wa-button>
          <wa-button appearance="outlined" size="small">테마</wa-button>
        </div>
      </header>
      <main class="main">
        ${
          isHome
            ? html`<section class="intro">
                  <p class="eyebrow">ON-DEVICE UTILITIES</p>
                  <h1>작업에 필요한 작은 도구들</h1>
                  <p class="description">
                    브라우저 안에서 안전하게 처리하는 개인용 도구 모음입니다.
                  </p>
                </section>
                <section aria-labelledby="tools-heading">
                  <h2 id="tools-heading">도구</h2>
                  <div class="tool-grid">
                    <article class="tool-card">
                      <span class="tool-icon" aria-hidden="true">{ }</span>
                      <h3>JSON Formatter</h3>
                      <p>JSON을 보기 좋게 정리하고 압축합니다.</p>
                      <wa-button
                        variant="brand"
                        @click=${() => navigate('json-formatter')}
                        >열기</wa-button
                      >
                    </article>
                  </div>
                </section>`
            : html`<section class="route-state">
                <p class="eyebrow">TOOL</p>
                <h1>
                  ${this.route.kind === 'tool' ? this.route.id : '페이지를 찾을 수 없습니다'}
                </h1>
                <p class="description">
                  ${this.route.kind === 'tool' ? '도구 화면은 다음 단계에서 연결합니다.' : '요청한 경로를 확인해주세요.'}
                </p>
                <wa-button variant="brand" @click=${() => navigate('')}
                  >홈으로</wa-button
                >
              </section>`
        }
      </main>
    `
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
      width: min(1120px, calc(100% - 2 * var(--app-space-6)));
      margin: 0 auto;
      padding: 72px 0;
    }
    .intro {
      max-width: 680px;
      margin-bottom: 56px;
    }
    .eyebrow {
      color: var(--app-brand);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.12em;
    }
    h1 {
      margin: 12px 0;
      font-size: clamp(2.25rem, 6vw, 4.5rem);
      line-height: 1.05;
      letter-spacing: -0.05em;
    }
    h2 {
      margin: 0 0 20px;
      font-size: 1.5rem;
    }
    h3 {
      margin: 16px 0 8px;
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
      font-size: 1.25rem;
    }
    @media (max-width: 600px) {
      .header {
        padding-inline: var(--app-space-4);
      }
      .main {
        width: calc(100% - 2 * var(--app-space-4));
        padding-block: 48px;
      }
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'app-shell': AppShell
  }
}
