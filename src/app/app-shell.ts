import '@awesome.me/webawesome/dist/styles/webawesome.css'
import '@awesome.me/webawesome/dist/components/button/button.js'
import '@awesome.me/webawesome/dist/components/select/select.js'
import '@awesome.me/webawesome/dist/components/option/option.js'
import '@awesome.me/webawesome/dist/components/dialog/dialog.js'
import '@awesome.me/webawesome/dist/components/dropdown/dropdown.js'
import '@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js'
import '@awesome.me/webawesome/dist/components/icon/icon.js'
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
    const value = (event as CustomEvent<{ item: { value: string } }>).detail
      .item.value
    setLocale(value as LocalePreference)
  }
  private selectTheme(event: Event) {
    const value = (event as CustomEvent<{ item: { value: string } }>).detail
      .item.value
    setTheme(value as Theme)
  }
  render() {
    return html`<header class="header">
        <a class="brand" href="/tools/">Local Tools</a>
        <div class="actions">
          ${this.updateAvailable ? html`<wa-button variant="brand" size="s" title=${t('pwa.updateAvailable')} @click=${this.openUpdateDialog}>${t('pwa.update')}</wa-button>` : ''}
          <wa-dropdown @wa-select=${this.selectLocale}>
            <wa-button
              slot="trigger"
              appearance="plain"
              size="s"
              aria-label=${t('settings.language')}
              title=${t('settings.language')}
            >
              <wa-icon name="language"></wa-icon>
            </wa-button>
            <wa-dropdown-item value="system"
              >${getLocalePreference() === 'system' ? html`<wa-icon slot="icon" name="check"></wa-icon>` : ''}${t('settings.system')}</wa-dropdown-item
            >
            <wa-dropdown-item value="ko"
              >${getLocalePreference() === 'ko' ? html`<wa-icon slot="icon" name="check"></wa-icon>` : ''}한국어</wa-dropdown-item
            >
            <wa-dropdown-item value="en"
              >${getLocalePreference() === 'en' ? html`<wa-icon slot="icon" name="check"></wa-icon>` : ''}English</wa-dropdown-item
            >
          </wa-dropdown>
          <wa-dropdown @wa-select=${this.selectTheme}>
            <wa-button
              slot="trigger"
              appearance="plain"
              size="s"
              aria-label=${t('settings.theme')}
              title=${t('settings.theme')}
            >
              <wa-icon
                name=${getResolvedTheme() === 'dark' ? 'moon' : 'sun'}
              ></wa-icon>
            </wa-button>
            <wa-dropdown-item value="system"
              >${getTheme() === 'system' ? html`<wa-icon slot="icon" name="check"></wa-icon>` : ''}${t('settings.system')}</wa-dropdown-item
            >
            <wa-dropdown-item value="light"
              >${getTheme() === 'light' ? html`<wa-icon slot="icon" name="check"></wa-icon>` : ''}${t('settings.light')}</wa-dropdown-item
            >
            <wa-dropdown-item value="dark"
              >${getTheme() === 'dark' ? html`<wa-icon slot="icon" name="check"></wa-icon>` : ''}${t('settings.dark')}</wa-dropdown-item
            >
          </wa-dropdown>
        </div>
      </header>
      <main class="main">${this.renderMain()}</main>
      <wa-dialog
        label=${t('pwa.confirmTitle')}
        ?open=${this.confirmUpdateOpen}
        @wa-hide=${() => {
          this.confirmUpdateOpen = false
        }}
        ><p>${t('pwa.confirmMessage')}</p>
        <div slot="footer">
          <wa-button @click=${this.cancelUpdate}
            >${t('actions.cancel')}</wa-button
          ><wa-button variant="brand" @click=${this.confirmUpdate}
            >${t('pwa.update')}</wa-button
          >
        </div></wa-dialog
      >`
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
      align-items: center;
      gap: var(--app-space-2);
    }
    .actions label {
      color: var(--app-muted);
      font-size: 0.8rem;
    }
    .actions select {
      margin-left: 4px;
      padding: 6px 8px;
      border: 1px solid var(--app-border);
      border-radius: 8px;
      background: var(--app-surface);
      color: var(--app-text);
    }
    .actions wa-button {
      color: var(--app-text);
    }
    .actions wa-icon {
      font-size: 1.1rem;
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
      .header {
        padding: 8px var(--app-space-4);
      }
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
