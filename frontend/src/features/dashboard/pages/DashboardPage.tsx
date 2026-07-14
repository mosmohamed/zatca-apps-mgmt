import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Activity,
  AppWindow,
  Cpu,
  Link2,
  Truck,
  Users,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from "recharts"

import { EmptyState } from "@/components/EmptyState"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard"
import type { DashboardChartItem } from "@/features/dashboard/services/dashboard-service"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/utils/format"

const CHART_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#0EA5E9",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EF4444",
  "#14B8A6",
  "#EC4899",
]

const CHART_ANIMATION = {
  animationDuration: 1500,
  animationBegin: 200,
}

function toChartKey(value: string, index: number): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return slug || `item-${index}`
}

function colorForIndex(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length]
}

function withBarColors(items: DashboardChartItem[]) {
  return items.map((item, index) => {
    const key = toChartKey(item.name, index)
    return {
      ...item,
      key,
      fill: colorForIndex(index),
    }
  })
}

function buildNamedChartConfig(
  items: DashboardChartItem[],
  valueLabel: string
): ChartConfig {
  const config: ChartConfig = {
    count: { label: valueLabel },
  }

  items.forEach((item, index) => {
    const key = toChartKey(item.name, index)
    config[key] = {
      label: item.name,
      color: colorForIndex(index),
    }
  })

  return config
}

export function DashboardPage() {
  const { t } = useTranslation()
  const { user, isSuperAdmin } = useAuth()
  const navigate = useNavigate()
  const dashboardQuery = useDashboard()
  const [activeStatus, setActiveStatus] = useState<string>("all")

  const data = dashboardQuery.data
  const totals = data?.totals

  const technologyUsage = data?.charts.technologies_usage ?? []
  const employeesPerApplication =
    data?.charts.employees_per_application ?? []
  const applicationsByStatus = data?.charts.applications_by_status ?? []
  const applicationsByDepartment =
    data?.charts.applications_by_department ?? []
  const recentActivity = data?.recent_activity ?? []

  const employeesChartData = useMemo(
    () =>
      employeesPerApplication.map((item, index) => {
        const key = toChartKey(item.name, index)
        return {
          key,
          name: item.name,
          count: item.count,
          fill: `var(--color-${key})`,
        }
      }),
    [employeesPerApplication]
  )

  const employeesConfig = useMemo(
    () =>
      buildNamedChartConfig(
        employeesPerApplication,
        t("dashboard.charts.employeesLabel")
      ),
    [employeesPerApplication, t]
  )

  const employeesTotal = useMemo(
    () => employeesChartData.reduce((sum, item) => sum + item.count, 0),
    [employeesChartData]
  )

  const technologiesRadarData = useMemo(
    () =>
      technologyUsage.map((item) => ({
        technology: item.name,
        count: item.count,
      })),
    [technologyUsage]
  )

  const technologiesConfig = useMemo(
    () =>
      ({
        count: {
          label: t("dashboard.charts.applicationsLabel"),
          color: "var(--chart-1)",
        },
      }) satisfies ChartConfig,
    [t]
  )

  const statusSourceData = useMemo(
    () => withBarColors(applicationsByStatus),
    [applicationsByStatus]
  )

  const statusChartData = useMemo(() => {
    if (activeStatus === "all") {
      return statusSourceData
    }
    return statusSourceData.filter((item) => item.name === activeStatus)
  }, [activeStatus, statusSourceData])

  const statusTotal = useMemo(
    () => applicationsByStatus.reduce((sum, item) => sum + item.count, 0),
    [applicationsByStatus]
  )

  const statusConfig = useMemo(
    () =>
      buildNamedChartConfig(
        applicationsByStatus,
        t("dashboard.charts.applicationsLabel")
      ),
    [applicationsByStatus, t]
  )

  const departmentChartData = useMemo(
    () => withBarColors(applicationsByDepartment),
    [applicationsByDepartment]
  )

  const departmentConfig = useMemo(
    () =>
      buildNamedChartConfig(
        applicationsByDepartment,
        t("dashboard.charts.applicationsLabel")
      ),
    [applicationsByDepartment, t]
  )

  if (dashboardQuery.isLoading) {
    return <LoadingSkeleton rows={10} />
  }

  const kpiCards = [
    {
      label: t("dashboard.kpi.applications"),
      value: totals?.applications ?? 0,
      icon: AppWindow,
      to: "/applications",
      accent: "from-sky-500/15 to-sky-500/5 text-sky-700",
    },
    {
      label: t("dashboard.kpi.activeUsers"),
      value: totals?.active_users ?? 0,
      icon: Users,
      to: "/users",
      accent: "from-emerald-500/15 to-emerald-500/5 text-emerald-700",
    },
    {
      label: t("dashboard.kpi.vendors"),
      value: totals?.vendors ?? 0,
      icon: Truck,
      to: "/vendors",
      accent: "from-amber-500/15 to-amber-500/5 text-amber-700",
    },
    {
      label: t("dashboard.kpi.technologies"),
      value: totals?.technologies ?? 0,
      icon: Cpu,
      to: "/technologies",
      accent: "from-violet-500/15 to-violet-500/5 text-violet-700",
    },
  ]

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-stroke bg-gradient-to-br from-card via-card to-sky-500/5 p-6 shadow-sm">
        <div className="pointer-events-none absolute -end-16 -top-16 size-48 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 start-10 size-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <p className="text-sm text-muted-foreground">{t("dashboard.welcomeBack")}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          {user?.full_name ?? t("common.user")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {isSuperAdmin
            ? t("dashboard.adminBlurb")
            : t("dashboard.employeeBlurb")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.to}
              type="button"
              onClick={() => navigate(item.to)}
              className={cn(
                "group rounded-2xl border border-stroke bg-gradient-to-br p-5 text-start shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                item.accent
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <span className="rounded-lg bg-background/70 p-2 shadow-sm transition-transform duration-300 group-hover:scale-110">
                  <Icon className="size-4" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {item.value}
              </p>
            </button>
          )
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="py-0">
          <CardHeader className="items-center pb-0 pt-6">
            <CardTitle>{t("dashboard.charts.topTechnologies")}</CardTitle>
            <CardDescription>
              {t("dashboard.charts.topTechnologiesDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            {technologiesRadarData.length === 0 ? (
              <EmptyState
                title={t("dashboard.charts.emptyTitle")}
                description={t("dashboard.charts.emptyTechnologies")}
              />
            ) : (
              <ChartContainer
                config={technologiesConfig}
                className="mx-auto aspect-square max-h-[320px]"
              >
                <RadarChart data={technologiesRadarData}>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <PolarGrid
                    gridType="circle"
                    radialLines={false}
                    stroke="var(--border)"
                  />
                  <PolarAngleAxis dataKey="technology" />
                  <Radar
                    dataKey="count"
                    fill="var(--color-count)"
                    fillOpacity={0.45}
                    stroke="var(--color-count)"
                    strokeWidth={2}
                    {...CHART_ANIMATION}
                  />
                </RadarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col py-0">
          <CardHeader className="items-center pb-0 pt-6">
            <CardTitle>{t("dashboard.charts.employeesPerApplication")}</CardTitle>
            <CardDescription>
              {t("dashboard.charts.employeesPerApplicationDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-6">
            {employeesChartData.length === 0 ? (
              <EmptyState
                title={t("dashboard.charts.emptyTitle")}
                description={t("dashboard.charts.emptyEmployees")}
              />
            ) : (
              <ChartContainer
                config={employeesConfig}
                className="mx-auto aspect-square max-h-[320px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel nameKey="key" />}
                  />
                  <Pie
                    data={employeesChartData}
                    dataKey="count"
                    nameKey="key"
                    innerRadius={68}
                    strokeWidth={4}
                    {...CHART_ANIMATION}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {employeesTotal.toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy ?? 0) + 24}
                                className="fill-muted-foreground text-sm"
                              >
                                {t("dashboard.charts.employeesLabel")}
                              </tspan>
                            </text>
                          )
                        }
                        return null
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="py-0">
          <CardHeader className="flex flex-col items-stretch border-b border-stroke p-0 sm:flex-row">
            <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
              <CardTitle>{t("dashboard.charts.applicationsByStatus")}</CardTitle>
              <CardDescription>
                {t("dashboard.charts.applicationsByStatusDesc")}
              </CardDescription>
            </div>
            <div className="flex flex-wrap">
              <button
                type="button"
                data-active={activeStatus === "all"}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-stroke px-6 py-4 text-start even:border-s data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-s sm:px-8 sm:py-6"
                onClick={() => setActiveStatus("all")}
              >
                <span className="text-xs text-muted-foreground">
                  {t("dashboard.charts.allStatuses")}
                </span>
                <span className="text-lg font-bold leading-none sm:text-2xl">
                  {statusTotal.toLocaleString()}
                </span>
              </button>
              {applicationsByStatus.map((status) => (
                <button
                  key={status.name}
                  type="button"
                  data-active={activeStatus === status.name}
                  className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-stroke px-6 py-4 text-start even:border-s data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-s sm:px-8 sm:py-6"
                  onClick={() => setActiveStatus(status.name)}
                >
                  <span className="text-xs text-muted-foreground">
                    {status.name}
                  </span>
                  <span className="text-lg font-bold leading-none sm:text-2xl">
                    {status.count.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:p-6">
            {statusChartData.length === 0 ? (
              <EmptyState
                title={t("dashboard.charts.emptyTitle")}
                description={t("dashboard.charts.emptyStatus")}
              />
            ) : (
              <ChartContainer
                config={statusConfig}
                className="aspect-auto h-[280px] w-full"
              >
                <BarChart
                  accessibilityLayer
                  data={statusChartData}
                  margin={{ left: 12, right: 12 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent className="w-[150px]" nameKey="count" />
                    }
                  />
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    {...CHART_ANIMATION}
                  >
                    {statusChartData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={entry.fill}
                        stroke={entry.fill}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardHeader className="pt-6">
            <CardTitle>
              {t("dashboard.charts.applicationsByDepartment")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.charts.applicationsByDepartmentDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            {applicationsByDepartment.length === 0 ? (
              <EmptyState
                title={t("dashboard.charts.emptyTitle")}
                description={t("dashboard.charts.emptyDepartments")}
              />
            ) : (
              <ChartContainer
                config={departmentConfig}
                className="aspect-auto h-[280px] w-full"
              >
                <BarChart
                  accessibilityLayer
                  data={departmentChartData}
                  layout="vertical"
                  margin={{ left: 8, right: 16 }}
                >
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={110}
                    tickMargin={8}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 6, 6, 0]}
                    {...CHART_ANIMATION}
                  >
                    {departmentChartData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={entry.fill}
                        stroke={entry.fill}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-sky-600" />
            <div>
              <CardTitle>{t("dashboard.recentTitle")}</CardTitle>
              <CardDescription>{t("dashboard.recentDescription")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <EmptyState
              title={t("dashboard.recentEmptyTitle")}
              description={t("dashboard.recentEmptyDescription")}
            />
          ) : (
            <ul className="max-h-72 space-y-0 overflow-y-auto pe-1">
              {recentActivity.map((activity) => (
                <li
                  key={activity.id}
                  className="border-b border-stroke py-3 last:border-b-0"
                >
                  <p className="text-sm font-medium leading-snug">
                    {activity.description}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activity.causer?.name ?? t("common.user")}
                    {activity.created_at
                      ? ` · ${formatDateTime(activity.created_at)}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {isSuperAdmin ? (
          <>
            <Button onClick={() => navigate("/assignments")}>
              <Link2 className="size-4" />
              {t("dashboard.goToAssignments")}
            </Button>
            <Button variant="outline" onClick={() => navigate("/applications")}>
              {t("dashboard.manageApplications")}
            </Button>
            <Button variant="outline" onClick={() => navigate("/technologies")}>
              <Cpu className="size-4" />
              {t("dashboard.manageTechnologies")}
            </Button>
          </>
        ) : (
          <div className="rounded-xl border border-stroke bg-card p-4 text-sm text-muted-foreground">
            {t("dashboard.needAccess")}
            <Button asChild variant="link" className="ms-1 h-auto p-0">
              <Link to="/assignments">{t("dashboard.viewMyAssignments")}</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
