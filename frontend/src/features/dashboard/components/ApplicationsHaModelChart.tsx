import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Server } from "lucide-react"
import { Label, Pie, PieChart, Sector } from "recharts"

import { EmptyState } from "@/components/EmptyState"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { DashboardChartCard } from "@/features/dashboard/components/DashboardChartCard"
import type { DashboardChartItem } from "@/features/dashboard/services/dashboard-service"
import {
  localizeChartName,
  toChartKey,
} from "@/features/dashboard/utils/chart-labels"
import { cn } from "@/lib/utils"

const HA_COLORS: Record<string, string> = {
  "Active/Active": "#0EA5E9",
  "Active/Passive": "#8B5CF6",
  "Hot Standby": "#F59E0B",
  "Cold Standby": "#64748B",
}

const ANIMATION = {
  animationDuration: 1200,
  animationBegin: 100,
}

type ApplicationsHaModelChartProps = {
  items: DashboardChartItem[]
}

export function ApplicationsHaModelChart({
  items,
}: ApplicationsHaModelChartProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const chartData = useMemo(
    () =>
      items.map((item, index) => {
        const key = toChartKey(item, index)
        return {
          key,
          name: localizeChartName(item, isArabic),
          count: item.count,
          fill: HA_COLORS[key] ?? `var(--chart-${(index % 5) + 1})`,
        }
      }),
    [isArabic, items]
  )

  const config = useMemo(() => {
    const next: ChartConfig = {
      count: { label: t("dashboard.kpi.applications") },
    }
    chartData.forEach((item) => {
      next[item.key] = { label: item.name, color: item.fill }
    })
    return next
  }, [chartData, t])

  const total = useMemo(
    () => chartData.reduce((sum, item) => sum + item.count, 0),
    [chartData]
  )

  const active = activeIndex === null ? null : (chartData[activeIndex] ?? null)

  return (
    <DashboardChartCard
      title={t("dashboard.charts.applicationsByHaModel")}
      description={t("dashboard.charts.applicationsByHaModelDesc")}
      icon={Server}
      accentClassName="from-cyan-500/12 via-transparent to-transparent"
      className="h-full"
    >
      {chartData.length === 0 || total === 0 ? (
        <EmptyState
          title={t("dashboard.charts.emptyTitle")}
          description={t("dashboard.charts.emptyHaModel")}
        />
      ) : (
        <div className="grid items-center gap-4 sm:grid-cols-[10rem_1fr]">
          <ChartContainer
            config={config}
            className="mx-auto aspect-square h-40 w-40"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="name" />}
              />
              <Pie
                data={chartData.filter((item) => item.count > 0)}
                dataKey="count"
                nameKey="name"
                startAngle={90}
                endAngle={-270}
                innerRadius={44}
                outerRadius={64}
                paddingAngle={3}
                strokeWidth={2}
                stroke="hsl(var(--card))"
                onMouseEnter={(_, index) => {
                  const visible = chartData.filter((item) => item.count > 0)
                  const target = visible[index]
                  if (!target) {
                    return
                  }
                  setActiveIndex(
                    chartData.findIndex((item) => item.key === target.key)
                  )
                }}
                onMouseLeave={() => setActiveIndex(null)}
                shape={(props) => {
                  const {
                    cx = 0,
                    cy = 0,
                    innerRadius = 0,
                    outerRadius = 0,
                    startAngle = 0,
                    endAngle = 0,
                    fill,
                    index = 0,
                  } = props as {
                    cx?: number
                    cy?: number
                    innerRadius?: number
                    outerRadius?: number
                    startAngle?: number
                    endAngle?: number
                    fill?: string
                    index?: number
                  }
                  const visible = chartData.filter((item) => item.count > 0)
                  const target = visible[index]
                  const fullIndex = target
                    ? chartData.findIndex((item) => item.key === target.key)
                    : -1
                  const isActive = activeIndex === fullIndex
                  return (
                    <Sector
                      cx={cx}
                      cy={cy}
                      innerRadius={innerRadius}
                      outerRadius={isActive ? outerRadius + 4 : outerRadius}
                      startAngle={startAngle}
                      endAngle={endAngle}
                      fill={fill}
                      cornerRadius={6}
                    />
                  )
                }}
                {...ANIMATION}
              >
                <Label
                  content={({ viewBox }) => {
                    if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                      return null
                    }
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) - 6}
                          className="fill-foreground text-xl font-bold"
                        >
                          {(active?.count ?? total).toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 14}
                          className="fill-muted-foreground text-[11px]"
                        >
                          {active?.name ?? t("dashboard.kpi.applications")}
                        </tspan>
                      </text>
                    )
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>

          <div className="grid gap-2 sm:grid-cols-2">
            {chartData.map((item, index) => {
              const share =
                total > 0 ? Math.round((item.count / total) * 100) : 0
              const isActive = activeIndex === index
              return (
                <button
                  key={item.key}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={cn(
                    "flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-start transition-all",
                    isActive
                      ? "border-border bg-muted/50 shadow-sm"
                      : "border-transparent bg-muted/20 hover:bg-muted/35"
                  )}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium">
                    {item.name}
                  </span>
                  <span className="text-xs font-semibold tabular-nums">
                    {item.count.toLocaleString()}
                  </span>
                  <span className="w-8 text-end text-[11px] tabular-nums text-muted-foreground">
                    {share}%
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </DashboardChartCard>
  )
}
