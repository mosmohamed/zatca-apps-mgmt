import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import {
  environmentLabel,
  type ApplicationInfrastructureEnvironment,
} from "@/features/applications/types/infrastructure"
import { cn } from "@/lib/utils"

type EnvironmentTabsProps = {
  environments: ApplicationInfrastructureEnvironment[]
  value: number | null
  onChange: (environmentId: number) => void
  className?: string
}

export function EnvironmentTabs({
  environments,
  value,
  onChange,
  className,
}: EnvironmentTabsProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")

  return (
    <div
      role="tablist"
      aria-label={t("applications.infrastructure.environmentSwitcher")}
      className={cn(
        "flex flex-wrap gap-2 rounded-xl border border-stroke/80 bg-muted/30 p-1.5",
        className
      )}
    >
      {environments.map((entry) => {
        const isActive = entry.environment.id === value
        const isConfigured = entry.profile !== null

        return (
          <button
            key={entry.environment.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(entry.environment.id)}
            className={cn(
              "group flex min-w-[7.5rem] flex-1 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-start transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "border-primary/40 bg-background shadow-sm"
                : "border-transparent hover:border-stroke/70 hover:bg-background/70"
            )}
          >
            <span className="min-w-0">
              <span
                className={cn(
                  "block truncate text-sm font-semibold",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {entry.environment.code}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {environmentLabel(entry.environment, isArabic)}
              </span>
            </span>
            <Badge
              variant={isConfigured ? "secondary" : "outline"}
              className={cn(
                "shrink-0 rounded-full px-2 text-[10px]",
                isConfigured &&
                  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              )}
            >
              {isConfigured
                ? t("applications.infrastructure.configured")
                : t("applications.infrastructure.notConfigured")}
            </Badge>
          </button>
        )
      })}
    </div>
  )
}
