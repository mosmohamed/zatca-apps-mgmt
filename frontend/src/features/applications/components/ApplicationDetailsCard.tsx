import type { CSSProperties } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowRight,
  Building2,
  Layers3,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
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

export type ApplicationDetailsCardModel = {
  id: number
  displayName: string
  code: string
  statusName: string
  departmentName: string
  typeName: string
  techCount: number
  activeUsers: number
  accentIndex: number
}

type ApplicationDetailsCardProps = {
  card: ApplicationDetailsCardModel
  style?: CSSProperties
}

export function ApplicationDetailsCard({
  card,
  style,
}: ApplicationDetailsCardProps) {
  const { t } = useTranslation()
  const accent = ACCENTS[card.accentIndex % ACCENTS.length]

  return (
    <Link
      to={`/applications-details/${card.id}`}
      style={style}
      className={cn(
        "group relative block cursor-pointer overflow-hidden rounded-2xl border border-stroke/90 bg-card outline-none",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-[0_12px_28px_-12px_rgba(15,23,42,0.18)]",
        "focus-visible:ring-2 focus-visible:ring-ring",
        "animate-in fade-in-0 zoom-in-95",
        accent.ring
      )}
    >
      <div
        className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", accent.bar)}
      />
      <div
        className={cn(
          "absolute -end-10 -top-10 size-28 rounded-full bg-gradient-to-br opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100",
          accent.soft
        )}
      />

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight">
              {card.displayName}
            </p>
            <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
              {card.code}
            </p>
          </div>
          <Badge
            variant="secondary"
            className="shrink-0 rounded-full px-2.5"
          >
            {card.statusName}
          </Badge>
        </div>

        <p className="mt-3 truncate text-xs text-muted-foreground">
          {card.typeName}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-muted/45 px-2.5 py-2.5 transition-colors duration-300 group-hover:bg-muted/70">
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users className="size-3" />
              {t("applicationsDetails.metrics.users")}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">
              {card.activeUsers}
            </p>
          </div>
          <div className="rounded-xl bg-muted/45 px-2.5 py-2.5 transition-colors duration-300 group-hover:bg-muted/70">
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Building2 className="size-3" />
              {t("applicationsDetails.metrics.department")}
            </p>
            <p className="mt-1 truncate text-xs font-semibold leading-5">
              {card.departmentName}
            </p>
          </div>
          <div className="rounded-xl bg-muted/45 px-2.5 py-2.5 transition-colors duration-300 group-hover:bg-muted/70">
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Layers3 className="size-3" />
              {t("applicationsDetails.metrics.technologies")}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">
              {card.techCount}
            </p>
          </div>
        </div>

        <p
          className={cn(
            "mt-4 flex items-center gap-1 text-sm font-medium transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5",
            accent.text
          )}
        >
          {t("applicationsDetails.viewDetails")}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </p>
      </div>
    </Link>
  )
}
