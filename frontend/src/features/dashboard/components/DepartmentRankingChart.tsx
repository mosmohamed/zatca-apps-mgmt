import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Building2 } from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { DashboardChartCard } from "@/features/dashboard/components/DashboardChartCard"
import type { DashboardChartItem } from "@/features/dashboard/services/dashboard-service"
import {
  colorForIndex,
  localizeChartName,
  toChartKey,
  truncateLabel,
} from "@/features/dashboard/utils/chart-labels"
import { useCountUp } from "@/hooks/use-count-up"
import { cn } from "@/lib/utils"

type DepartmentRankingChartProps = {
  items: DashboardChartItem[]
}

function RankRow({
  name,
  count,
  max,
  fill,
  index,
  active,
  onHover,
}: {
  name: string
  count: number
  max: number
  fill: string
  index: number
  active: boolean
  onHover: (hovering: boolean) => void
}) {
  const animated = useCountUp(count, { durationMs: 900 + index * 40 })
  const width = max > 0 ? Math.max(6, Math.round((count / max) * 100)) : 0

  return (
    <button
      type="button"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      className={cn(
        "group w-full rounded-xl px-2 py-2 text-start transition-colors",
        active ? "bg-muted/50" : "hover:bg-muted/35"
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-background text-[10px] font-semibold tabular-nums text-muted-foreground ring-1 ring-border/70">
            {index + 1}
          </span>
          <span className="truncate" title={name}>
            {truncateLabel(name, 28)}
          </span>
        </span>
        <span className="shrink-0 text-sm font-semibold tabular-nums">
          {animated}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/70">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${fill}, color-mix(in oklab, ${fill} 55%, transparent))`,
            boxShadow: active ? `0 0 0 1px color-mix(in oklab, ${fill} 35%, transparent)` : undefined,
          }}
        />
      </div>
    </button>
  )
}

export function DepartmentRankingChart({ items }: DepartmentRankingChartProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const rows = useMemo(() => {
    return [...items]
      .map((item, index) => {
        const key = toChartKey(item, index)
        return {
          key,
          name: localizeChartName(item, isArabic),
          count: item.count,
          fill: colorForIndex(index),
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [isArabic, items])

  const max = rows[0]?.count ?? 0

  return (
    <DashboardChartCard
      widgetKey="applications_by_department"
      title={t("dashboard.charts.applicationsByDepartment")}
      description={t("dashboard.charts.applicationsByDepartmentDesc")}
      icon={Building2}
      accentClassName="from-emerald-500/12 via-transparent to-transparent"
    >
      {rows.length === 0 ? (
        <EmptyState
          title={t("dashboard.charts.emptyTitle")}
          description={t("dashboard.charts.emptyDepartments")}
        />
      ) : (
        <div className="max-h-[var(--dashboard-chart-height,240px)] space-y-0.5 overflow-y-auto pe-1">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className="animate-in fade-in-0 slide-in-from-start-2 fill-mode-both duration-500"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <RankRow
                name={row.name}
                count={row.count}
                max={max}
                fill={row.fill}
                index={index}
                active={activeKey === row.key}
                onHover={(hovering) =>
                  setActiveKey(hovering ? row.key : null)
                }
              />
            </div>
          ))}
        </div>
      )}
    </DashboardChartCard>
  )
}
