import { readStorage, writeStorage } from '../services/storage'
export type Theme = 'system' | 'light' | 'dark'
const storedTheme = readStorage('theme')
let theme: Theme =
  storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'system'
const listeners = new Set<() => void>()
const media = window.matchMedia('(prefers-color-scheme: dark)')
export function getResolvedTheme(): 'light' | 'dark' {
  return theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
}
function applyTheme() {
  const resolved = getResolvedTheme()
  document.documentElement.dataset.theme = resolved
  document.documentElement.style.colorScheme = resolved
}
applyTheme()
media.addEventListener('change', () => {
  if (theme === 'system') {
    applyTheme()
    listeners.forEach((listener) => listener())
  }
})
export function getTheme(): Theme {
  return theme
}
export function setTheme(next: Theme): void {
  theme = next
  writeStorage('theme', next)
  applyTheme()
  listeners.forEach((listener) => listener())
}
export function subscribeToTheme(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
