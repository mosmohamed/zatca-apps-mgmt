import type { LucideIcon } from "lucide-react"

import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { useCountUp } from "@/hooks/use-count-up"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/utils/format"

export type EntityStatAccent = {
  card: string
  strip: string
  icon: string
}

export type EntityStatCardDefinition = {
  key: string
  label: string
  value: number
  icon: LucideIcon
  accent: EntityStatAccent
}

/** Accent presets matching the licenses page KPI cards. */
export const ENTITY_STAT_ACCENTS = {
  sky: {
    card: "border-sky-500/20 bg-sky-500/[0.04] dark:border-sky-400/25 dark:bg-sky-400/[0.06]",
    strip: "bg-sky-500",
    icon: "text-sky-500/15 group-hover:text-sky-500/25",
  },
  emerald: {
    card: "border-emerald-500/20 bg-emerald-500/[0.04] dark:border-emerald-400/25 dark:bg-emerald-400/[0.06]",
    strip: "bg-emerald-500",
    icon: "text-emerald-500/15 group-hover:text-emerald-500/25",
  },
  violet: {
    card: "border-violet-500/20 bg-violet-500/[0.04] dark:border-violet-400/25 dark:bg-violet-400/[0.06]",
    strip: "bg-violet-500",
    icon: "text-violet-500/15 group-hover:text-violet-500/25",
  },
  amber: {
    card: "border-amber-500/20 bg-amber-500/[0.04] dark:border-amber-400/25 dark:bg-amber-400/[0.06]",
    strip: "bg-amber-500",
    icon: "text-amber-500/15 group-hover:text-amber-500/25",
  },
  teal: {
    card: "border-teal-500/20 bg-teal-500/[0.04] dark:border-teal-400/25 dark:bg-teal-400/[0.06]",
    strip: "bg-teal-500",
    icon: "text-teal-500/15 group-hover:text-teal-500/25",
  },
  red: {
    card: "border-red-500/20 bg-red-500/[0.04] dark:border-red-400/25 dark:bg-red-400/[0.06]",
    strip: "bg-red-500",
    icon: "text-red-500/15 group-hover:text-red-500/25",
  },
} as const satisfies Record<string, EntityStatAccent>

function EntityStatCard({
  label,
  value,
  icon: Icon,
  accent,
  index,
}: {
  label: string
  value: number
  icon: LucideIcon
  accent: EntityStatAccent
  index: number
}) {
  const displayValue = useCountUp(value, { durationMs: 900 })

  return (
    <div
      style={{ animationDelay: `${index * 60}ms` }}
      className={cn(
        "group relative overflow-hidden rounded-xl border p-4 text-start",
        "shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)]",
        "animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both duration-400",
        accent.card
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-3 start-0 w-[3px] rounded-full",
          accent.strip
        )}
      />
      <Icon
        aria-hidden
        className={cn(
          "pointer-events-none absolute -bottom-3 -end-3 size-24 transition-opacity duration-200",
          accent.icon
        )}
        strokeWidth={1.15}
      />
      <div className="relative ps-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums text-foreground">
          {formatNumber(displayValue)}
        </p>
      </div>
    </div>
  )
}

type EntityStatsCardsProps = {
  items: EntityStatCardDefinition[]
  isLoading?: boolean
  /** Tailwind grid columns. Defaults to a 4-up layout. */
  className?: string
}

export function EntityStatsCards({
  items,
  isLoading = false,
  className,
}: EntityStatsCardsProps) {
  if (isLoading) {
    return <LoadingSkeleton variant="cards" />
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
        className
      )}
    >
      {items.map((card, index) => (
        <EntityStatCard
          key={card.key}
          label={card.label}
          value={card.value}
          icon={card.icon}
          accent={card.accent}
          index={index}
        />
      ))}
    </div>
  )
}
