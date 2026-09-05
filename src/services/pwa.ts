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
  const currentAssetUrls = [
    ...Array.from(
      document.querySelectorAll<HTMLScriptElement>('script[src]'),
    ).map((script) => script.src),
    ...Array.from(document.querySelectorAll<HTMLLinkElement>('link[href]')).map(
      (link) => link.href,
    ),
  ]
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const urls = (await cache.keys()).map((request) => request.url)
    const hasCurrentShell = currentAssetUrls.every((url) => urls.includes(url))
    if (
      hasCurrentShell &&
      patterns.every((pattern) => urls.some((url) => url.includes(pattern)))
    )
      return true
  }
  return false
}
