import '@awesome.me/webawesome/dist/components/dialog/dialog.js'
import { LitElement, css } from 'lit'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { t } from '../i18n/i18n'

@customElement('update-confirm-dialog')
export class UpdateConfirmDialog extends LitElement {
  @property({ type: Boolean }) open = false

  private dispatchCancel() {
    this.dispatchEvent(
      new CustomEvent('cancel', { bubbles: true, composed: true }),
    )
  }

  private dispatchConfirm() {
    this.dispatchEvent(
      new CustomEvent('confirm', { bubbles: true, composed: true }),
    )
  }

  render() {
    return html`<wa-dialog
      label=${t('pwa.confirmTitle')}
      ?open=${this.open}
      @wa-hide=${() => this.dispatchCancel()}
      ><p>${t('pwa.confirmMessage')}</p>
      <div slot="footer">
        <wa-button @click=${() => this.dispatchCancel()}
          >${t('actions.cancel')}</wa-button
        ><wa-button variant="brand" @click=${() => this.dispatchConfirm()}
          >${t('pwa.update')}</wa-button
        >
      </div></wa-dialog
    >`
  }

  static styles = css`
    :host {
      display: contents;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'update-confirm-dialog': UpdateConfirmDialog
  }
}
