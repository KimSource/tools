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
    ...Array.from(
      document.querySelectorAll<HTMLLinkElement>(
        'link[rel="stylesheet"], link[rel="modulepreload"], link[rel="icon"], link[rel="manifest"]',
      ),
    ).map((link) => link.href),
  ]
  if (currentAssetUrls.length === 0 || patterns.length === 0) return false
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const urls = (await cache.keys()).map((request) => {
      const url = new URL(request.url)
      // Workbox revisions unversioned assets with this cache-key parameter.
      // Keep hashed filenames and all other query parameters intact.
      url.searchParams.delete('__WB_REVISION__')
      return url.href
    })
    const hasCurrentShell = currentAssetUrls.every((url) => urls.includes(url))
    if (
      hasCurrentShell &&
      patterns.every((pattern) => urls.some((url) => url.includes(pattern)))
    )
      return true
  }
  return false
}
