import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import type { AppLocale } from "@/lib/locale"
import { cn } from "@/lib/utils"

export function LanguageSwitcher({ className }: { className?: string }) {
  const { t, i18n } = useTranslation()
  const active: AppLocale = i18n.language === "ar" ? "ar" : "en"

  async function switchLocale(locale: AppLocale) {
    if (locale === active) {
      return
    }
    await i18n.changeLanguage(locale)
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-stroke p-0.5",
        className
      )}
      role="group"
      aria-label={t("common.language")}
    >
      <Button
        type="button"
        variant={active === "en" ? "default" : "ghost"}
        size="sm"
        className="h-8 min-w-10 px-2.5 text-xs font-semibold"
        aria-label={t("common.switchToEnglish")}
        aria-pressed={active === "en"}
        onClick={() => void switchLocale("en")}
      >
        EN
      </Button>
      <Button
        type="button"
        variant={active === "ar" ? "default" : "ghost"}
        size="sm"
        className="h-8 min-w-10 px-2.5 text-xs font-semibold"
        aria-label={t("common.switchToArabic")}
        aria-pressed={active === "ar"}
        onClick={() => void switchLocale("ar")}
      >
        ع
      </Button>
    </div>
  )
}
