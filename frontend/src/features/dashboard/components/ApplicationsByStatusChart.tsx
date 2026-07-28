import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { PieChart } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

import { EmptyState } from "@/components/EmptyState"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DashboardChartCard } from "@/features/dashboard/components/DashboardChartCard"
import type { DashboardChartItem } from "@/features/dashboard/services/dashboard-service"
import {
  colorForIndex,
  localizeChartName,
  toChartKey,
} from "@/features/dashboard/utils/chart-labels"

const CHART_ANIMATION = {
  animationDuration: 900,
  animationBegin: 80,
}

const CHART_TICK_STYLE = {
  fill: "var(--muted-foreground)",
  fontSize: 11,
}

type ApplicationsByStatusChartProps = {
  items: DashboardChartItem[]
}

/**
 * Compact status mix chart sized for a third-width dashboard tile.
 */
export function ApplicationsByStatusChart({
  items,
}: ApplicationsByStatusChartProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")
  const [activeStatus, setActiveStatus] = useState("all")

  const statusSourceData = useMemo(
    () =>
      items.map((item, index) => {
        const key = toChartKey(item, index)
        return {
          key,
          name: localizeChartName(item, isArabic),
          count: item.count,
          fill: colorForIndex(index),
        }
      }),
    [isArabic, items]
  )

  const statusChartData = useMemo(() => {
    if (activeStatus === "all") {
      return statusSourceData
    }
    return statusSourceData.filter((item) => item.key === activeStatus)
  }, [activeStatus, statusSourceData])

  const statusTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.count, 0),
    [items]
  )

  const statusConfig = useMemo(() => {
    const next: ChartConfig = {
      count: { label: t("dashboard.charts.applicationsLabel") },
    }
    statusSourceData.forEach((item) => {
      next[item.key] = { label: item.name, color: item.fill }
    })
    return next
  }, [statusSourceData, t])

  return (
    <DashboardChartCard
      widgetKey="applications_by_status"
      title={t("dashboard.charts.applicationsByStatus")}
      description={t("dashboard.charts.applicationsByStatusDesc")}
      icon={PieChart}
      accentClassName="from-sky-500/12 via-transparent to-transparent"
      headerExtra={
        <Select value={activeStatus} onValueChange={setActiveStatus}>
          <SelectTrigger
            size="sm"
            className="h-8 w-[7.5rem] shrink-0 border-border/70 bg-background/80 text-xs"
            aria-label={t("dashboard.charts.allStatuses")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">
              {t("dashboard.charts.allStatuses")} ({statusTotal})
            </SelectItem>
            {statusSourceData.map((status) => (
              <SelectItem key={status.key} value={status.key}>
                {status.name} ({status.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {statusChartData.length === 0 ? (
        <EmptyState
          title={t("dashboard.charts.emptyTitle")}
          description={t("dashboard.charts.emptyStatus")}
        />
      ) : (
        <ChartContainer
          config={statusConfig}
          className="aspect-auto h-[var(--dashboard-chart-height,240px)] w-full"
        >
          <BarChart
            accessibilityLayer
            data={statusChartData}
            margin={{ left: 4, right: 4, top: 8, bottom: 0 }}
          >
            <defs>
              {statusChartData.map((entry) => (
                <linearGradient
                  key={`grad-${entry.key}`}
                  id={`status-grad-${entry.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={entry.fill} stopOpacity={1} />
                  <stop
                    offset="100%"
                    stopColor={entry.fill}
                    stopOpacity={0.35}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 6" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={CHART_TICK_STYLE}
              interval={0}
              angle={statusChartData.length > 3 ? -25 : 0}
              textAnchor={statusChartData.length > 3 ? "end" : "middle"}
              height={statusChartData.length > 3 ? 48 : 28}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={28}
              tick={CHART_TICK_STYLE}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent className="w-[140px]" nameKey="count" />
              }
            />
            <Bar dataKey="count" radius={[8, 8, 4, 4]} {...CHART_ANIMATION}>
              {statusChartData.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={`url(#status-grad-${entry.key})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </DashboardChartCard>
  )
}
