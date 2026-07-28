import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Users } from "lucide-react"
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

type EmployeesDonutChartProps = {
  items: DashboardChartItem[]
}

export function EmployeesDonutChart({ items }: EmployeesDonutChartProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isArabic = i18n.language.startsWith("ar")
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const chartData = useMemo(
    () =>
      items.map((item, index) => {
        const key = toChartKey(item, index)
        return {
          key,
          id: item.id,
          name: localizeChartName(item, isArabic),
          count: item.count,
          fill: colorForIndex(index),
        }
      }),
    [isArabic, items]
  )

  const config = useMemo(() => {
    const next: ChartConfig = {
      count: { label: t("dashboard.charts.employeesLabel") },
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
  const activeShare =
    active && total > 0 ? Math.round((active.count / total) * 100) : 0

  function openApplication(applicationId: number | string | undefined | null) {
    const id = Number(applicationId)
    if (!Number.isFinite(id) || id <= 0) {
      return
    }
    navigate(`/applications/${id}`)
  }

  return (
    <DashboardChartCard
      widgetKey="employees_per_application"
      title={t("dashboard.charts.employeesPerApplication")}
      description={t("dashboard.charts.employeesPerApplicationDesc")}
      icon={Users}
      accentClassName="from-violet-500/12 via-transparent to-transparent"
    >
      {chartData.length === 0 ? (
        <EmptyState
          title={t("dashboard.charts.emptyTitle")}
          description={t("dashboard.charts.emptyEmployees")}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_11rem]">
          <ChartContainer
            config={config}
            className="mx-auto aspect-square max-h-[280px] w-full"
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
                innerRadius={72}
                outerRadius={104}
                paddingAngle={2}
                strokeWidth={3}
                stroke="hsl(var(--card))"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={(_, index) => openApplication(chartData[index]?.id)}
                className="cursor-pointer outline-none"
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
                    <g>
                      <Sector
                        cx={cx}
                        cy={cy}
                        innerRadius={innerRadius}
                        outerRadius={isActive ? outerRadius + 8 : outerRadius}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        fill={fill}
                        className="transition-all duration-300"
                      />
                      {isActive ? (
                        <Sector
                          cx={cx}
                          cy={cy}
                          innerRadius={outerRadius + 12}
                          outerRadius={outerRadius + 16}
                          startAngle={startAngle}
                          endAngle={endAngle}
                          fill={fill}
                          fillOpacity={0.45}
                        />
                      ) : null}
                    </g>
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
                          y={(viewBox.cy ?? 0) - 8}
                          className="fill-foreground text-3xl font-bold tracking-tight"
                        >
                          {active
                            ? active.count.toLocaleString()
                            : total.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 16}
                          className="fill-muted-foreground text-[11px]"
                        >
                          {active
                            ? `${activeShare}% · ${truncateLabel(active.name, 12)}`
                            : t("dashboard.charts.employeesLabel")}
                        </tspan>
                      </text>
                    )
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>

          <ul className="flex max-h-[280px] flex-col gap-1.5 overflow-y-auto pe-1">
            {chartData.map((item, index) => {
              const share =
                total > 0 ? Math.round((item.count / total) * 100) : 0
              const isActive = activeIndex === index
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onFocus={() => setActiveIndex(index)}
                    onBlur={() => setActiveIndex(null)}
                    onClick={() => openApplication(item.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start transition-colors",
                      isActive ? "bg-muted/60" : "hover:bg-muted/40"
                    )}
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">
                      {item.name}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {share}%
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
