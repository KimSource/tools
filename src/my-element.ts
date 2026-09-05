import '@awesome.me/webawesome/dist/styles/webawesome.css'
import '@awesome.me/webawesome/dist/components/button/button.js'
import '@awesome.me/webawesome/dist/components/select/select.js'
import '@awesome.me/webawesome/dist/components/option/option.js'
import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { navigate, parseHash, subscribeToRoute, type Route } from './app/router'
import { getTool, toolRegistry } from './app/tool-registry'
import {
  getLocalePreference,
  setLocale,
  subscribeToLocale,
  t,
  type LocalePreference,
} from './i18n/i18n'
import { getTheme, setTheme, subscribeToTheme, type Theme } from './theme/theme'

@customElement('app-shell')
export class AppShell extends LitElement {
  private route: Route = parseHash(window.location.hash)
  private loading = false
  private failed = false
  private unsubscribe?: () => void
  private unsubscribeLocale?: () => void
  private unsubscribeTheme?: () => void
  connectedCallback() {
    super.connectedCallback()
    this.unsubscribe = subscribeToRoute((route) => {
      this.route = route
      void this.loadTool(route)
      this.requestUpdate()
    })
    this.unsubscribeLocale = subscribeToLocale(() => this.requestUpdate())
    this.unsubscribeTheme = subscribeToTheme(() => this.requestUpdate())
  }
  disconnectedCallback() {
    this.unsubscribe?.()
    this.unsubscribeLocale?.()
    this.unsubscribeTheme?.()
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
    return html`<json-formatter-tool></json-formatter-tool>`
  }
  render() {
    return html`<header class="header">
        <a class="brand" href="/tools/">Local Tools</a>
        <div class="actions">
          <wa-select
            label=${t('settings.language')}
            size="small"
            .value=${getLocalePreference()}
            @change=${(event: Event) => setLocale((event.target as HTMLElement & { value: string }).value as LocalePreference)}
            ><wa-option value="system">${t('settings.system')}</wa-option
            ><wa-option value="ko">한국어</wa-option
            ><wa-option value="en">English</wa-option></wa-select
          >
          <wa-select
            label=${t('settings.theme')}
            size="small"
            .value=${getTheme()}
            @change=${(event: Event) => setTheme((event.target as HTMLElement & { value: string }).value as Theme)}
            ><wa-option value="system">${t('settings.system')}</wa-option
            ><wa-option value="light">${t('settings.light')}</wa-option
            ><wa-option value="dark"
              >${t('settings.dark')}</wa-option
            ></wa-select
          >
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
    .actions wa-select {
      --label-color: var(--app-muted);
    }
    .actions wa-select::part(form-control-label) {
      color: var(--app-muted);
    }
    .actions wa-select::part(combobox),
    .actions wa-select::part(display-input),
    .actions wa-select::part(listbox) {
      background: var(--app-surface);
      color: var(--app-text);
    }
    .actions wa-option {
      --wa-color-neutral-fill-normal: var(--app-surface);
      --wa-color-neutral-on-normal: var(--app-text);
      --wa-form-control-activated-color: var(--app-brand);
      --wa-color-brand-on-loud: #fff;
      color: var(--app-text);
    }
    .actions wa-option::part(label) {
      color: var(--app-text);
    }
    .actions wa-option[aria-selected='true']::part(label) {
      color: #fff;
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
