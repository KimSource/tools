import { registerSW } from 'virtual:pwa-register'

let update: ((reloadPage?: boolean) => Promise<void>) | undefined
let available = false
const listeners = new Set<() => void>()

export function initializePwa(): void {
  update = registerSW({
    onNeedRefresh: () => {
      available = true
      listeners.forEach((listener) => listener())
    },
  }) as (reloadPage?: boolean) => Promise<void>
}
export function isUpdateAvailable(): boolean {
  return available
}
export async function applyUpdate(): Promise<void> {
  await update?.(true)
}
export function subscribeToPwa(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
