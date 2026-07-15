import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { KeyRound } from "lucide-react"
import {
  PolarAngleAxis,
  PolarGrid,
  RadialBar,
  RadialBarChart,
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
  localizeChartName,
  toChartKey,
} from "@/features/dashboard/utils/chart-labels"
import { useCountUp } from "@/hooks/use-count-up"

const USAGE_COLORS: Record<string, string> = {
  licensed: "#0EA5E9",
  used: "#8B5CF6",
  available: "#10B981",
}

const ANIMATION = {
  animationDuration: 1400,
  animationBegin: 150,
}

type LicenseUsageRadialChartProps = {
  items: DashboardChartItem[]
}

function MetricChip({
  label,
  value,
  color,
  index,
}: {
  label: string
  value: number
  color: string
  index: number
}) {
  const animated = useCountUp(value, { durationMs: 900 + index * 80 })

  return (
    <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
        {animated.toLocaleString()}
      </p>
    </div>
  )
}

export function LicenseUsageRadialChart({
  items,
}: LicenseUsageRadialChartProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")

  const chartData = useMemo(() => {
    const max = Math.max(...items.map((item) => item.count), 1)
    return items.map((item, index) => {
      const key = toChartKey(item, index)
      const color = USAGE_COLORS[key] ?? USAGE_COLORS.licensed
      return {
        key,
        name: localizeChartName(item, isArabic),
        count: item.count,
        fill: color,
        // RadialBar visual scale relative to max for nicer arcs
        value: item.count,
        max,
      }
    })
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

  return (
    <DashboardChartCard
      title={t("dashboard.charts.licenseUsage")}
      description={t("dashboard.charts.licenseUsageDesc")}
      icon={KeyRound}
      accentClassName="from-cyan-500/12 via-transparent to-transparent"
    >
      {chartData.length === 0 ? (
        <EmptyState
          title={t("dashboard.charts.emptyTitle")}
          description={t("dashboard.charts.emptyLicenses")}
        />
      ) : (
        <div className="space-y-4">
          <ChartContainer
            config={config}
            className="mx-auto aspect-square max-h-[240px] w-full"
          >
            <RadialBarChart
              data={chartData}
              startAngle={90}
              endAngle={-270}
              innerRadius="28%"
              outerRadius="100%"
            >
              <PolarGrid
                gridType="circle"
                radialLines={false}
                stroke="var(--border)"
                strokeOpacity={0.55}
              />
              <PolarAngleAxis type="number" domain={[0, "dataMax"]} tick={false} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent nameKey="name" hideLabel />}
              />
              <RadialBar
                dataKey="count"
                background={{ fill: "var(--muted)" }}
                cornerRadius={10}
                {...ANIMATION}
              />
            </RadialBarChart>
          </ChartContainer>

          <div className="grid grid-cols-3 gap-2">
            {chartData.map((item, index) => (
              <MetricChip
                key={item.key}
                label={item.name}
                value={item.count}
                color={item.fill}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </DashboardChartCard>
  )
}
