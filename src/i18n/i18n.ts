import { en } from './en'
import { ko } from './ko'
import type { Locale, Messages } from './types'

const dictionaries: Record<Locale, Messages> = { ko, en }
let locale: Locale = 'ko'
const listeners = new Set<() => void>()

export function t(key: string): string {
  return dictionaries[locale][key] ?? dictionaries.en[key] ?? key
}
export function getLocale(): Locale {
  return locale
}
export function setLocale(next: Locale): void {
  if (locale === next) return
  locale = next
  listeners.forEach((listener) => listener())
}
export function subscribeToLocale(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
