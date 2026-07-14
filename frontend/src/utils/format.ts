import i18n from "@/lib/i18n"
import type { AppLocale } from "@/lib/locale"

export function getCurrentLocale(): AppLocale {
  const language = i18n.resolvedLanguage ?? i18n.language
  return language === "ar" ? "ar" : "en"
}

export function formatDateTime(
  value: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) {
    return "—"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(getCurrentLocale(), {
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  }).format(date)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(getCurrentLocale()).format(value)
}
