import type { CSSProperties, MouseEvent } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowRight, Download, Layers3, Loader2, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useReleaseManagementEscalationExport } from "@/features/release-management/hooks/use-release-management-escalation-export"
import type { ReleaseManagementTeamsDetailsCard } from "@/features/release-management/types/release-management"
import { cn } from "@/lib/utils"

const ACCENTS = [
  {
    bar: "from-sky-500 to-cyan-400",
    soft: "from-sky-500/12 to-cyan-500/5",
    ring: "group-hover:border-sky-400/50",
    text: "text-sky-700 dark:text-sky-300",
  },
  {
    bar: "from-emerald-500 to-teal-400",
    soft: "from-emerald-500/12 to-teal-500/5",
    ring: "group-hover:border-emerald-400/50",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  {
    bar: "from-violet-500 to-fuchsia-400",
    soft: "from-violet-500/12 to-fuchsia-500/5",
    ring: "group-hover:border-violet-400/50",
    text: "text-violet-700 dark:text-violet-300",
  },
  {
    bar: "from-amber-500 to-orange-400",
    soft: "from-amber-500/12 to-orange-500/5",
    ring: "group-hover:border-amber-400/50",
    text: "text-amber-700 dark:text-amber-300",
  },
] as const

type ReleaseManagementStreamCardProps = {
  card: ReleaseManagementTeamsDetailsCard
  accentIndex: number
  style?: CSSProperties
}

export function ReleaseManagementStreamCard({
  card,
  accentIndex,
  style,
}: ReleaseManagementStreamCardProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")
  const { can } = useAuth()
  const canExport = can("release-management-escalation-matrix.view")
  const { exportCategory, isExportingCategory } = useReleaseManagementEscalationExport()
  const accent = ACCENTS[accentIndex % ACCENTS.length]
  const exporting = isExportingCategory(card.id)

  const title = isArabic ? card.title_ar : card.title_en
  const detailPath = `/release-management-escalation-matrix/${card.id}`

  const activeLevelsCount = card.levels.filter(
    (level) => level.members.length > 0
  ).length

  function handleExport(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    void exportCategory(card.id)
  }

  return (
    <div
      style={style}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl border border-stroke/90 bg-card",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-[0_12px_28px_-12px_rgba(15,23,42,0.18)]",
        "animate-in fade-in-0 zoom-in-95",
        accent.ring
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
          accent.bar
        )}
      />
      <div
        className={cn(
          "absolute -end-10 -top-10 size-28 rounded-full bg-gradient-to-br opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100",
          accent.soft
        )}
      />

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="line-clamp-2 text-base font-semibold tracking-tight">
              {title}
            </p>
            <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
              {card.code}
            </p>
          </div>
          {canExport ? (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="relative z-20 shrink-0 bg-background/80"
              disabled={exporting}
              onClick={handleExport}
              aria-label={t("releaseManagement.details.exportCategory")}
            >
              {exporting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Download className="size-3.5" />
              )}
            </Button>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-muted/45 px-2.5 py-2.5 transition-colors duration-300 group-hover:bg-muted/70">
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users className="size-3" />
              {t("releaseManagement.details.metrics.members")}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">
              {card.members_count}
            </p>
          </div>
          <div className="rounded-xl bg-muted/45 px-2.5 py-2.5 transition-colors duration-300 group-hover:bg-muted/70">
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Layers3 className="size-3" />
              {t("releaseManagement.details.metrics.levels")}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">
              {activeLevelsCount}
            </p>
          </div>
        </div>

        <span
          className={cn(
            "mt-4 inline-flex items-center gap-1 text-sm font-medium transition-transform duration-300",
            "group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5",
            accent.text
          )}
        >
          {t("releaseManagement.details.viewDetails")}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </span>
      </div>

      <Link
        to={detailPath}
        className="absolute inset-0 z-10 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${title} — ${t("releaseManagement.details.viewDetails")}`}
      />
    </div>
  )
}
