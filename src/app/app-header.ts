import '@awesome.me/webawesome/dist/components/dropdown/dropdown.js'
import '@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js'
import '@awesome.me/webawesome/dist/components/icon/icon.js'
import { LitElement, css } from 'lit'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { t, type LocalePreference } from '../i18n/i18n'
import { type Theme } from '../theme/theme'

@customElement('app-header')
export class AppHeader extends LitElement {
  @property({ type: Boolean }) updateAvailable = false
  @property() localePreference: LocalePreference = 'system'
  @property() themePreference: Theme = 'system'
  @property() resolvedTheme: 'light' | 'dark' = 'light'

  private requestLocaleChange(event: Event) {
    const value = (event as CustomEvent<{ item: { value: string } }>).detail
      .item.value as LocalePreference
    this.dispatchEvent(
      new CustomEvent<LocalePreference>('locale-change', {
        detail: value,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private requestThemeChange(event: Event) {
    const value = (event as CustomEvent<{ item: { value: string } }>).detail
      .item.value as Theme
    this.dispatchEvent(
      new CustomEvent<Theme>('theme-change', {
        detail: value,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private requestUpdateAction() {
    this.dispatchEvent(
      new CustomEvent('update-request', { bubbles: true, composed: true }),
    )
  }

  render() {
    return html`<header class="header">
      <a class="brand" href="/tools/">${t('app.name')}</a>
      <div class="actions">
        ${this.updateAvailable ? html`<wa-button variant="brand" size="s" title=${t('pwa.updateAvailable')} @click=${() => this.requestUpdateAction()}>${t('pwa.update')}</wa-button>` : ''}
        <wa-dropdown @wa-select=${this.requestLocaleChange}>
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
            >${this.localePreference === 'system' ? html`<wa-icon slot="icon" name="check"></wa-icon>` : ''}${t('settings.system')}</wa-dropdown-item
          >
          <wa-dropdown-item value="ko"
            >${this.localePreference === 'ko' ? html`<wa-icon slot="icon" name="check"></wa-icon>` : ''}한국어</wa-dropdown-item
          >
          <wa-dropdown-item value="en"
            >${this.localePreference === 'en' ? html`<wa-icon slot="icon" name="check"></wa-icon>` : ''}English</wa-dropdown-item
          >
        </wa-dropdown>
        <wa-dropdown @wa-select=${this.requestThemeChange}>
          <wa-button
            slot="trigger"
            appearance="plain"
            size="s"
            aria-label=${t('settings.theme')}
            title=${t('settings.theme')}
          >
            <wa-icon
              name=${this.resolvedTheme === 'dark' ? 'moon' : 'sun'}
            ></wa-icon>
          </wa-button>
          <wa-dropdown-item value="system"
            >${this.themePreference === 'system' ? html`<wa-icon slot="icon" name="check"></wa-icon>` : ''}${t('settings.system')}</wa-dropdown-item
          >
          <wa-dropdown-item value="light"
            >${this.themePreference === 'light' ? html`<wa-icon slot="icon" name="check"></wa-icon>` : ''}${t('settings.light')}</wa-dropdown-item
          >
          <wa-dropdown-item value="dark"
            >${this.themePreference === 'dark' ? html`<wa-icon slot="icon" name="check"></wa-icon>` : ''}${t('settings.dark')}</wa-dropdown-item
          >
        </wa-dropdown>
      </div>
    </header>`
  }

  static styles = css`
    :host {
      display: block;
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
    .actions wa-button {
      color: var(--app-text);
    }
    .actions wa-icon {
      font-size: 1.1rem;
    }
    @media (max-width: 600px) {
      .header {
        padding: 8px var(--app-space-4);
      }
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'app-header': AppHeader
  }
}
