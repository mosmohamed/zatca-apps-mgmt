export const LOCALE_STORAGE_KEY = "it-portfolio-locale"

export type AppLocale = "en" | "ar"

export function isAppLocale(value: string): value is AppLocale {
  return value === "en" || value === "ar"
}

export function getStoredLocale(): AppLocale {
  if (typeof window === "undefined") {
    return "en"
  }

  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
  if (stored && isAppLocale(stored)) {
    return stored
  }

  return "en"
}

export function storeLocale(locale: AppLocale): void {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
}

export function applyDocumentLocale(locale: AppLocale): void {
  const direction = locale === "ar" ? "rtl" : "ltr"
  document.documentElement.lang = locale
  document.documentElement.dir = direction
  storeLocale(locale)
}

export function getLocaleDirection(locale: AppLocale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr"
}
