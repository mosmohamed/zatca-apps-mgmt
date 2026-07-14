import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import zatcaLogo from "@/assets/ZATCA-logo.svg"

type AppLogoProps = {
  className?: string
  imgClassName?: string
  showWordmark?: boolean
}

export function AppLogo({
  className,
  imgClassName,
  showWordmark = false,
}: AppLogoProps) {
  const { t } = useTranslation()

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <img
        src={zatcaLogo}
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
