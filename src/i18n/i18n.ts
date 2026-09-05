import { en } from './en'
import { ko } from './ko'
import { readStorage, writeStorage } from '../services/storage'
import type { Locale } from './types'
import type { TranslationKey } from './en'
export type LocalePreference = Locale | 'system'
const dictionaries: Record<Locale, Record<TranslationKey, string>> = { ko, en }
const storedLocale = readStorage('locale')
let preference: LocalePreference =
  storedLocale === 'ko' || storedLocale === 'en' ? storedLocale : 'system'
let locale: Locale = resolveLocale()
const listeners = new Set<() => void>()
function resolveLocale(): Locale {
  if (preference !== 'system') return preference
  for (const language of navigator.languages) {
    const base = language.toLowerCase().split('-')[0]
    if (base === 'ko' || base === 'en') return base
  }
  return 'en'
}
export function t(key: TranslationKey): string {
  return dictionaries[locale][key] ?? dictionaries.en[key] ?? key
}
export function getLocale(): Locale {
  return locale
}
export function getLocalePreference(): LocalePreference {
  return preference
}
export function setLocale(next: LocalePreference): void {
  preference = next
  locale = resolveLocale()
  writeStorage('locale', next)
  listeners.forEach((listener) => listener())
}
export function subscribeToLocale(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
