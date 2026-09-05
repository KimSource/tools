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

export async function areAssetsCached(
  patterns: readonly string[],
): Promise<boolean> {
  if (!('caches' in window)) return false
  const cacheNames = await caches.keys()
  const requests = await Promise.all(
    cacheNames.flatMap(async (cacheName) => {
      const cache = await caches.open(cacheName)
      return cache.keys()
    }),
  )
  const urls = requests.flat().map((request) => request.url)
  return patterns.every((pattern) => urls.some((url) => url.includes(pattern)))
}
