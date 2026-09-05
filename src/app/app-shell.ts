import '@awesome.me/webawesome/dist/styles/webawesome.css'
import '@awesome.me/webawesome/dist/components/button/button.js'
import './app-header'
import './update-confirm-dialog'
import { LitElement, css } from 'lit'
import { html, unsafeStatic } from 'lit/static-html.js'
import { customElement } from 'lit/decorators.js'
import { navigate, parseHash, subscribeToRoute, type Route } from './router'
import { getTool, toolRegistry } from './tool-registry'
import {
  getLocalePreference,
  setLocale,
  subscribeToLocale,
  t,
  type LocalePreference,
} from '../i18n/i18n'
import {
  getResolvedTheme,
  getTheme,
  setTheme,
  subscribeToTheme,
  type Theme,
} from '../theme/theme'
import {
  applyUpdate,
  areAssetsCached,
  isUpdateAvailable,
  subscribeToPwa,
} from '../services/pwa'

@customElement('app-shell')
export class AppShell extends LitElement {
  private route: Route = parseHash(window.location.hash)
  private loading = false
  private failed = false
  private unsubscribe?: () => void
  private unsubscribeLocale?: () => void
  private unsubscribeTheme?: () => void
  private unsubscribePwa?: () => void
  private updateAvailable = isUpdateAvailable()
  private confirmUpdateOpen = false
  private offlineReady = new Set<string>()
  connectedCallback() {
    super.connectedCallback()
    this.unsubscribe = subscribeToRoute((route) => {
      this.route = route
      void this.loadTool(route)
      this.requestUpdate()
    })
    this.unsubscribeLocale = subscribeToLocale(() => this.requestUpdate())
    this.unsubscribeTheme = subscribeToTheme(() => this.requestUpdate())
    this.unsubscribePwa = subscribeToPwa(() => {
      this.updateAvailable = true
      this.requestUpdate()
    })
    void this.refreshOfflineStatus()
  }
  private async refreshOfflineStatus() {
    await navigator.serviceWorker?.ready
    const ready = await Promise.all(
      toolRegistry.map(
        async (tool) =>
          [tool.id, await areAssetsCached(tool.offlineAssetPatterns)] as const,
      ),
    )
    this.offlineReady = new Set(
      ready.filter(([, isReady]) => isReady).map(([id]) => id),
    )
    this.requestUpdate()
  }
  disconnectedCallback() {
    this.unsubscribe?.()
    this.unsubscribeLocale?.()
    this.unsubscribeTheme?.()
    this.unsubscribePwa?.()
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
        <p class="eyebrow">${t('app.eyebrow')}</p>
        <h1>${t('home.title')}</h1>
        <p class="description">${t('home.description')}</p>
        <h2>${t('tools.title')}</h2>
        <div class="tool-grid">
          ${toolRegistry.map(
            (tool) =>
              html`<article class="tool-card">
                <span class="tool-icon">{ }</span>
                <h3>${t(tool.titleKey)}</h3>
                <p>${t(tool.descriptionKey)}</p>
                ${this.offlineReady.has(tool.id) ? html`<p class="tool-availability">${t('tools.offlineReady')}</p>` : ''}
                <wa-button variant="brand" @click=${() => navigate(tool.id)}
                  >${t('actions.open')}</wa-button
                >
              </article>`,
          )}
        </div>
      </section>`
    if (this.route.kind === 'not-found')
      return html`<h1>${t('route.notFound')}</h1>
        <wa-button @click=${() => navigate('')}
          >${t('actions.home')}</wa-button
        >`
    const tool = getTool(this.route.id)
    if (!tool)
      return html`<h1>${t('route.toolNotFound')}</h1>
        <p>${t('route.unknownTool')}</p>
        <wa-button @click=${() => navigate('')}
          >${t('actions.home')}</wa-button
        >`
    if (this.loading) return html`<h1>${t('route.loading')}</h1>`
    if (this.failed)
      return html`<h1>${t('route.loadFailed')}</h1>
        <wa-button @click=${() => void this.loadTool(this.route)}
          >${t('actions.retry')}</wa-button
        >`
    return html`${this.offlineReady.has(tool.id) ? html`<p class="tool-availability">${t('tools.offlineReady')}</p>` : ''}
    ${unsafeStatic(`<${tool.elementTag}></${tool.elementTag}>`)}`
  }
  private openUpdateDialog() {
    this.confirmUpdateOpen = true
    super.requestUpdate()
  }

  private confirmUpdate() {
    this.confirmUpdateOpen = false
    void applyUpdate()
  }

  private cancelUpdate() {
    this.confirmUpdateOpen = false
    super.requestUpdate()
  }
  private selectLocale(event: Event) {
    setLocale((event as CustomEvent<LocalePreference>).detail)
  }
  private selectTheme(event: Event) {
    setTheme((event as CustomEvent<Theme>).detail)
  }
  render() {
    return html`<app-header
        .updateAvailable=${this.updateAvailable}
        .localePreference=${getLocalePreference()}
        .themePreference=${getTheme()}
        .resolvedTheme=${getResolvedTheme()}
        @locale-change=${this.selectLocale}
        @theme-change=${this.selectTheme}
        @update-request=${() => this.openUpdateDialog()}
      ></app-header>
      <main class="main">${this.renderMain()}</main>
      <update-confirm-dialog
        .open=${this.confirmUpdateOpen}
        @confirm=${() => this.confirmUpdate()}
        @cancel=${() => this.cancelUpdate()}
      ></update-confirm-dialog>`
  }
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      color: var(--app-text);
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
    .tool-availability {
      color: var(--app-brand) !important;
      font-size: 0.875rem;
      font-weight: 600;
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
    @media (max-width: 600px) {
      .main {
        width: min(100% - 32px, 1120px);
        padding: 40px 0;
      }
    }
  `
}
declare global {
  interface HTMLElementTagNameMap {
    'app-shell': AppShell
  }
}
