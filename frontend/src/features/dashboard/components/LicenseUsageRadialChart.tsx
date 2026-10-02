import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { KeyRound } from "lucide-react"
import { Label, Pie, PieChart, Sector } from "recharts"

import { EmptyState } from "@/components/EmptyState"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { DashboardChartCard } from "@/features/dashboard/components/DashboardChartCard"
import { useDashboardWidgetLayoutItem } from "@/features/dashboard/hooks/use-widget-layout"
import type { DashboardChartItem } from "@/features/dashboard/services/dashboard-service"
import type { DashboardWidgetKey } from "@/features/dashboard/types/dashboard-widgets"
import {
  localizeChartName,
  toChartKey,
} from "@/features/dashboard/utils/chart-labels"
import { cn } from "@/lib/utils"

const USAGE_COLORS: Record<string, string> = {
  licensed: "#0EA5E9",
  used: "#8B5CF6",
  available: "#10B981",
}

const ANIMATION = {
  animationDuration: 1200,
  animationBegin: 100,
}

type LicenseUsageWidgetKey =
  | "license_usage"
  | "infra_license_usage"
  | "service_desk_license_usage"
  | "network_ops_license_usage"
  | "smart_facilities_license_usage"

type LicenseUsageRadialChartProps = {
  items: DashboardChartItem[]
  widgetKey?: LicenseUsageWidgetKey
  titleKey?: string
  descriptionKey?: string
  accentClassName?: string
}

export function LicenseUsageRadialChart({
  items,
  widgetKey = "license_usage",
  titleKey = "dashboard.charts.appsLicenseUsage",
  descriptionKey = "dashboard.charts.appsLicenseUsageDesc",
  accentClassName = "from-cyan-500/12 via-transparent to-transparent",
}: LicenseUsageRadialChartProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")
  const layout = useDashboardWidgetLayoutItem(widgetKey as DashboardWidgetKey)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const chartData = useMemo(
    () =>
      items.map((item, index) => {
        const key = toChartKey(item, index)
        return {
          key,
          name: localizeChartName(item, isArabic),
          count: item.count,
          fill: USAGE_COLORS[key] ?? `var(--chart-${(index % 5) + 1})`,
        }
      }),
    [isArabic, items]
  )

  const config = useMemo(() => {
    const next: ChartConfig = {
      count: { label: t("dashboard.kpi.licenses") },
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
      widgetKey={widgetKey as DashboardWidgetKey}
      title={t(titleKey)}
      description={t(descriptionKey)}
      icon={KeyRound}
      accentClassName={accentClassName}
    >
      {chartData.length === 0 || total === 0 ? (
        <EmptyState
          title={t("dashboard.charts.emptyTitle")}
          description={t("dashboard.charts.emptyLicenses")}
        />
      ) : (
        <div className="space-y-4">
          <ChartContainer
            config={config}
            className="mx-auto aspect-square max-h-[var(--dashboard-chart-height,220px)] w-full"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="name" />}
              />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="name"
                startAngle={90}
                endAngle={-270}
                innerRadius={62}
                outerRadius={88}
                paddingAngle={3}
                strokeWidth={2}
                stroke="hsl(var(--card))"
                onMouseEnter={(_, index) => setActiveIndex(index)}
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
                  const isActive = activeIndex === index
                  return (
                    <Sector
                      cx={cx}
                      cy={cy}
                      innerRadius={innerRadius}
                      outerRadius={isActive ? outerRadius + 6 : outerRadius}
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
                          className="fill-foreground text-2xl font-bold"
                        >
                          {(active?.count ?? total).toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 14}
                          className="fill-muted-foreground text-[11px]"
                        >
                          {active?.name ?? t("dashboard.kpi.licenses")}
                        </tspan>
                      </text>
                    )
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>

          {layout.show_statistics || layout.show_legend ? (
            <div className="grid gap-2">
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
                      "flex items-center gap-3 rounded-xl border px-3 py-2 text-start transition-all",
                      isActive
                        ? "border-border bg-muted/50 shadow-sm"
                        : "border-transparent bg-muted/20 hover:bg-muted/35"
                    )}
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {item.name}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {item.count.toLocaleString()}
                    </span>
                    <span className="w-10 text-end text-xs tabular-nums text-muted-foreground">
                      {share}%
                    </span>
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      )}
    </DashboardChartCard>
  )
}
