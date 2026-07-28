import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Layers3 } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts"

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
  CHART_TICK_STYLE,
  colorForIndex,
  localizeChartName,
  toChartKey,
  truncateLabel,
} from "@/features/dashboard/utils/chart-labels"
import { cn } from "@/lib/utils"

const ANIMATION = {
  animationDuration: 1200,
  animationBegin: 120,
}

type LicenseEnvironmentBarsProps = {
  items: DashboardChartItem[]
}

export function LicenseEnvironmentBars({
  items,
}: LicenseEnvironmentBarsProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const chartData = useMemo(() => {
    const rows = items
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

    const total = rows.reduce((sum, row) => sum + row.count, 0)

    return rows.map((row) => ({
      ...row,
      share: total > 0 ? Math.round((row.count / total) * 100) : 0,
    }))
  }, [isArabic, items])

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

  const rowHeight = 44
  const chartHeight = Math.max(220, chartData.length * rowHeight + 24)

  return (
    <DashboardChartCard
      widgetKey="licenses_by_environment"
      title={t("dashboard.charts.licensesByEnvironment")}
      description={t("dashboard.charts.licensesByEnvironmentDesc")}
      icon={Layers3}
      accentClassName="from-sky-500/12 via-transparent to-transparent"
      headerExtra={
        total > 0 ? (
          <div className="rounded-lg border border-border/60 bg-background/70 px-2.5 py-1.5 text-end shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("dashboard.kpi.licenses")}
            </p>
            <p className="text-sm font-semibold tabular-nums leading-none">
              {total.toLocaleString()}
            </p>
          </div>
        ) : null
      }
    >
      {chartData.length === 0 ? (
        <EmptyState
          title={t("dashboard.charts.emptyTitle")}
          description={t("dashboard.charts.emptyLicenses")}
        />
      ) : (
        <div className="space-y-3">
          <ChartContainer
            config={config}
            className="w-full"
            style={{ height: chartHeight }}
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{
                top: 4,
                right: isArabic ? 12 : 36,
                left: 4,
                bottom: 4,
              }}
              barCategoryGap="28%"
            >
              <defs>
                {chartData.map((entry) => (
                  <linearGradient
                    key={`env-grad-${entry.key}`}
                    id={`env-grad-${entry.key}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor={entry.fill} stopOpacity={0.85} />
                    <stop offset="100%" stopColor={entry.fill} stopOpacity={0.35} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                horizontal={false}
                strokeDasharray="3 8"
                stroke="var(--border)"
                strokeOpacity={0.7}
              />
              <XAxis
                type="number"
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={CHART_TICK_STYLE}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={isArabic ? 108 : 96}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value: string) => truncateLabel(String(value), 14)}
                tick={CHART_TICK_STYLE}
              />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.35 }}
                content={
                  <ChartTooltipContent
                    labelKey="name"
                    formatter={(value, _name, item) => {
                      const payload = item?.payload as
                        | { share?: number; name?: string }
                        | undefined
                      const share = payload?.share ?? 0
                      return (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium tabular-nums">
                            {Number(value).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {share}%
                          </span>
                        </div>
                      )
                    }}
                  />
                }
              />
              <Bar
                dataKey="count"
                radius={[0, 10, 10, 0]}
                maxBarSize={22}
                onMouseEnter={(data) => {
                  const key = (data as { key?: string }).key
                  if (key) setActiveKey(key)
                }}
                onMouseLeave={() => setActiveKey(null)}
                {...ANIMATION}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={`url(#env-grad-${entry.key})`}
                    stroke={
                      activeKey === entry.key ? entry.fill : "transparent"
                    }
                    strokeWidth={activeKey === entry.key ? 1.5 : 0}
                    fillOpacity={
                      activeKey === null || activeKey === entry.key ? 1 : 0.35
                    }
                  />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  className="fill-foreground text-[11px] font-semibold"
                  formatter={(value) =>
                    typeof value === "number"
                      ? value.toLocaleString()
                      : String(value ?? "")
                  }
                />
              </Bar>
            </BarChart>
          </ChartContainer>

          <ul className="flex flex-wrap gap-2">
            {chartData.map((item) => {
              const isActive = activeKey === item.key
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveKey(item.key)}
                    onMouseLeave={() => setActiveKey(null)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                      isActive
                        ? "border-border bg-muted/60"
                        : "border-transparent bg-muted/25 hover:bg-muted/45"
                    )}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="max-w-[8rem] truncate font-medium">
                      {item.name}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {item.share}%
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </DashboardChartCard>
  )
}
