import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Activity,
  AppWindow,
  Cpu,
  KeyRound,
  Link2,
  Truck,
  Users,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { DashboardChartCard } from "@/features/dashboard/components/DashboardChartCard"
import { DashboardKpiCard } from "@/features/dashboard/components/DashboardKpiCard"
import { DashboardLiveHeader } from "@/features/dashboard/components/DashboardLiveHeader"
import { DepartmentRankingChart } from "@/features/dashboard/components/DepartmentRankingChart"
import { EmployeesDonutChart } from "@/features/dashboard/components/EmployeesDonutChart"
import { LicenseEnvironmentBars } from "@/features/dashboard/components/LicenseEnvironmentBars"
import { LicenseStatusDonutChart } from "@/features/dashboard/components/LicenseStatusDonutChart"
import { LicenseUsageRadialChart } from "@/features/dashboard/components/LicenseUsageRadialChart"
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard"
import type { DashboardChartItem } from "@/features/dashboard/services/dashboard-service"
import {
  CHART_TICK_STYLE,
  colorForIndex,
  localizeChartName,
  toChartKey,
  withLocalizedColors,
} from "@/features/dashboard/utils/chart-labels"
import { formatDateTime } from "@/utils/format"

const CHART_ANIMATION = {
  animationDuration: 1400,
  animationBegin: 160,
}

function buildNamedChartConfig(
  items: DashboardChartItem[],
  valueLabel: string,
  isArabic: boolean
): ChartConfig {
  const config: ChartConfig = {
    count: { label: valueLabel },
  }

  items.forEach((item, index) => {
    const key = toChartKey(item, index)
    config[key] = {
      label: localizeChartName(item, isArabic),
      color: colorForIndex(index),
    }
  })

  return config
}

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")
  const { isSuperAdmin } = useAuth()
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
  const licenseUsage = data?.charts.license_usage ?? []
  const licenseStatusDistribution =
    data?.charts.license_status_distribution ?? []
  const licensesByEnvironment = data?.charts.licenses_by_environment ?? []
  const recentActivity = data?.recent_activity ?? []

  const technologiesRadarData = useMemo(
    () =>
      technologyUsage.map((item) => ({
        technology: localizeChartName(item, isArabic),
        count: item.count,
      })),
    [isArabic, technologyUsage]
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
    () => withLocalizedColors(applicationsByStatus, isArabic),
    [applicationsByStatus, isArabic]
  )

  const statusChartData = useMemo(() => {
    if (activeStatus === "all") {
      return statusSourceData
    }
    return statusSourceData.filter(
      (item) => (item.key ?? item.name) === activeStatus
    )
  }, [activeStatus, statusSourceData])

  const statusTotal = useMemo(
    () => applicationsByStatus.reduce((sum, item) => sum + item.count, 0),
    [applicationsByStatus]
  )

  const statusConfig = useMemo(
    () =>
      buildNamedChartConfig(
        applicationsByStatus,
        t("dashboard.charts.applicationsLabel"),
        isArabic
      ),
    [applicationsByStatus, isArabic, t]
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
      accent: {
        card: "border-sky-500/20 bg-sky-500/[0.04] dark:border-sky-400/25 dark:bg-sky-400/[0.06]",
        strip: "bg-sky-500/80 dark:bg-sky-400/70",
        icon: "text-sky-600/12 dark:text-sky-300/15",
      },
    },
    {
      label: t("dashboard.kpi.activeUsers"),
      value: totals?.active_users ?? 0,
      icon: Users,
      to: "/users",
      accent: {
        card: "border-emerald-500/20 bg-emerald-500/[0.04] dark:border-emerald-400/25 dark:bg-emerald-400/[0.06]",
        strip: "bg-emerald-500/80 dark:bg-emerald-400/70",
        icon: "text-emerald-600/12 dark:text-emerald-300/15",
      },
    },
    {
      label: t("dashboard.kpi.vendors"),
      value: totals?.vendors ?? 0,
      icon: Truck,
      to: "/vendors",
      accent: {
        card: "border-amber-500/20 bg-amber-500/[0.04] dark:border-amber-400/25 dark:bg-amber-400/[0.06]",
        strip: "bg-amber-500/80 dark:bg-amber-400/70",
        icon: "text-amber-600/12 dark:text-amber-300/15",
      },
    },
    {
      label: t("dashboard.kpi.technologies"),
      value: totals?.technologies ?? 0,
      icon: Cpu,
      to: "/technologies",
      accent: {
        card: "border-violet-500/20 bg-violet-500/[0.04] dark:border-violet-400/25 dark:bg-violet-400/[0.06]",
        strip: "bg-violet-500/80 dark:bg-violet-400/70",
        icon: "text-violet-600/12 dark:text-violet-300/15",
      },
    },
    {
      label: t("dashboard.kpi.licenses"),
      value: totals?.licenses ?? 0,
      icon: KeyRound,
      to: "/licenses",
      accent: {
        card: "border-cyan-500/20 bg-cyan-500/[0.04] dark:border-cyan-400/25 dark:bg-cyan-400/[0.06]",
        strip: "bg-cyan-500/80 dark:bg-cyan-400/70",
        icon: "text-cyan-600/12 dark:text-cyan-300/15",
      },
    },
  ]

  return (
    <section className="space-y-6">
      <DashboardLiveHeader />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {kpiCards.map((item, index) => (
          <DashboardKpiCard
            key={item.to}
            label={item.label}
            value={item.value}
            icon={item.icon}
            to={item.to}
            index={index}
            accent={item.accent}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardChartCard
          title={t("dashboard.charts.topTechnologies")}
          description={t("dashboard.charts.topTechnologiesDesc")}
          icon={Cpu}
          accentClassName="from-violet-500/12 via-transparent to-transparent"
        >
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
                <PolarAngleAxis dataKey="technology" tick={CHART_TICK_STYLE} />
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
        </DashboardChartCard>

        <EmployeesDonutChart items={employeesPerApplication} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="relative overflow-hidden border-stroke/80 py-0 shadow-sm transition-shadow duration-300 hover:shadow-md">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-transparent"
          />
          <CardHeader className="relative z-10 flex flex-col items-stretch border-b border-stroke/60 bg-card/40 p-0 backdrop-blur-sm sm:flex-row">
            <div className="flex flex-1 flex-col justify-center gap-1 px-5 py-5 sm:py-6">
              <CardTitle className="text-base">
                {t("dashboard.charts.applicationsByStatus")}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {t("dashboard.charts.applicationsByStatusDesc")}
              </CardDescription>
            </div>
            <div className="flex flex-wrap">
              <button
                type="button"
                data-active={activeStatus === "all"}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-stroke px-5 py-4 text-start even:border-s data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-s sm:px-6 sm:py-6"
                onClick={() => setActiveStatus("all")}
              >
                <span className="text-xs text-muted-foreground">
                  {t("dashboard.charts.allStatuses")}
                </span>
                <span className="text-lg font-bold leading-none sm:text-2xl">
                  {statusTotal.toLocaleString()}
                </span>
              </button>
              {statusSourceData.map((status) => {
                const filterKey = status.key ?? status.name
                return (
                  <button
                    key={filterKey}
                    type="button"
                    data-active={activeStatus === filterKey}
                    className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-stroke px-5 py-4 text-start even:border-s data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-s sm:px-6 sm:py-6"
                    onClick={() => setActiveStatus(filterKey)}
                  >
                    <span className="text-xs text-muted-foreground">
                      {status.name}
                    </span>
                    <span className="text-lg font-bold leading-none sm:text-2xl">
                      {status.count.toLocaleString()}
                    </span>
                  </button>
                )
              })}
            </div>
          </CardHeader>
          <CardContent className="relative z-10 px-2 pb-5 sm:p-5">
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
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={CHART_TICK_STYLE}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="w-[150px]"
                        nameKey="count"
                      />
                    }
                  />
                  <Bar
                    dataKey="count"
                    radius={[10, 10, 4, 4]}
                    {...CHART_ANIMATION}
                  >
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
          </CardContent>
        </Card>

        <DepartmentRankingChart items={applicationsByDepartment} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <LicenseUsageRadialChart items={licenseUsage} />
        <LicenseStatusDonutChart items={licenseStatusDistribution} />
        <LicenseEnvironmentBars items={licensesByEnvironment} />
      </div>

      <Card className="border-stroke/80 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-300">
              <Activity className="size-4" />
            </span>
            <div>
              <CardTitle>{t("dashboard.recentTitle")}</CardTitle>
              <CardDescription>
                {t("dashboard.recentDescription")}
              </CardDescription>
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
