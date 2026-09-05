export type Route =
  | { kind: 'home' }
  | { kind: 'tool'; id: string }
  | { kind: 'not-found'; path: string }

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').replace(/\/+$/, '')

  if (path === '') return { kind: 'home' }
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path)) return { kind: 'tool', id: path }

  return { kind: 'not-found', path }
}

export function navigate(path: string): void {
  window.location.hash = path === '' ? '/' : `/${path}`
}

export function subscribeToRoute(onRoute: (route: Route) => void): () => void {
  const handleHashChange = () => onRoute(parseHash(window.location.hash))
  window.addEventListener('hashchange', handleHashChange)
  handleHashChange()
  return () => window.removeEventListener('hashchange', handleHashChange)
}
