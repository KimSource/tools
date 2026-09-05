import { registerSW } from 'virtual:pwa-register'
import './my-element'

registerSW({
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent('pwa-update-available'))
  },
})
