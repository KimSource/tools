export type Theme = 'light' | 'dark'

let theme: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches
  ? 'dark'
  : 'light'
const listeners = new Set<() => void>()

function applyTheme() {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}
applyTheme()

export function getTheme(): Theme {
  return theme
}
export function toggleTheme(): void {
  theme = theme === 'light' ? 'dark' : 'light'
  applyTheme()
  listeners.forEach((listener) => listener())
}
export function subscribeToTheme(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
