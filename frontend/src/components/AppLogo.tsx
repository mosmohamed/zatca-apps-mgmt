import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import zatcaLogo from "@/assets/ZATCA-logo.svg"
import zatcaLogoOnDark from "@/assets/ZATCA-logo-on-dark.svg"

type AppLogoProps = {
  className?: string
  imgClassName?: string
  showWordmark?: boolean
  /** `onDark` uses white wordmark fills for dark sidebar/chrome. */
  variant?: "default" | "onDark"
}

export function AppLogo({
  className,
  imgClassName,
  showWordmark = false,
  variant = "default",
}: AppLogoProps) {
  const { t } = useTranslation()
  const logoSrc = variant === "onDark" ? zatcaLogoOnDark : zatcaLogo

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <img
        src={logoSrc}
        alt={t("app.name")}
        className={cn("h-8 w-auto object-contain object-start", imgClassName)}
      />
      {showWordmark ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">
            {t("app.name")}
          </p>
          <p className="truncate text-xs opacity-70">{t("app.tagline")}</p>
        </div>
      ) : null}
    </div>
  )
}
