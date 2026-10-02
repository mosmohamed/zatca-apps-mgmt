import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import {
  Activity,
  AppWindow,
  Cpu,
  KeyRound,
  Link2,
  RotateCcw,
  Truck,
  Users,
} from "lucide-react"
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
} from "recharts"

import { EmptyState } from "@/components/EmptyState"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { ApplicationsByStatusChart } from "@/features/dashboard/components/ApplicationsByStatusChart"
import { ApplicationsHaModelChart } from "@/features/dashboard/components/ApplicationsHaModelChart"
import { DashboardChartCard } from "@/features/dashboard/components/DashboardChartCard"
import { DashboardKpiCard } from "@/features/dashboard/components/DashboardKpiCard"
import { DashboardLiveHeader } from "@/features/dashboard/components/DashboardLiveHeader"
import { DepartmentRankingChart } from "@/features/dashboard/components/DepartmentRankingChart"
import { EmployeesDonutChart } from "@/features/dashboard/components/EmployeesDonutChart"
import { LicenseEnvironmentBars } from "@/features/dashboard/components/LicenseEnvironmentBars"
import { LicenseStatusDonutChart } from "@/features/dashboard/components/LicenseStatusDonutChart"
import { LicenseUsageRadialChart } from "@/features/dashboard/components/LicenseUsageRadialChart"
import { SortableDashboardWidget } from "@/features/dashboard/components/SortableDashboardWidget"
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard"
import {
  useDashboardLayout,
  useResetDashboardLayout,
  useUpdateDashboardLayout,
} from "@/features/dashboard/hooks/use-dashboard-layout"
import { DashboardWidgetLayoutContext } from "@/features/dashboard/hooks/use-widget-layout"
import {
  DASHBOARD_HEADER_WIDGET_KEYS,
  DASHBOARD_WIDGET_KEYS,
  type DashboardWidgetKey,
  type DashboardWidgetsConfig,
} from "@/features/dashboard/types/dashboard-widgets"
import {
  DEFAULT_DASHBOARD_WIDGET_LAYOUT,
  normalizeDashboardWidgetLayout,
} from "@/features/dashboard/types/widget-layout-config"
import {
  CHART_TICK_STYLE,
  localizeChartName,
} from "@/features/dashboard/utils/chart-labels"
import {
  DASHBOARD_BOARD_GRID_CLASS,
  dashboardWidgetLayoutItem,
  dashboardWidgetShellStyle,
  dashboardWidgetSpanClassFromItem,
} from "@/features/dashboard/utils/widget-layout"
import { useSettings } from "@/features/settings/hooks/use-settings"
import { formatDateTime } from "@/utils/format"

const CHART_ANIMATION = {
  animationDuration: 1400,
  animationBegin: 160,
}

const HEADER_WIDGET_KEYS: readonly string[] = DASHBOARD_HEADER_WIDGET_KEYS

/**
 * Board widgets are the intersection of the role-scoped visibility setting and
 * the per-user saved order. Widgets enabled after the layout was saved are
 * appended at the end, mirroring the reconciliation done by the API.
 */
function resolveVisibleWidgets(
  order: DashboardWidgetKey[],
  widgets: DashboardWidgetsConfig,
  can: (permission: string) => boolean
): DashboardWidgetKey[] {
  const enabled = DASHBOARD_WIDGET_KEYS.filter((key) => {
    if (HEADER_WIDGET_KEYS.includes(key) || !widgets[key]) {
      return false
    }

    const permission = DASHBOARD_WIDGET_PERMISSIONS[key]
    return permission === null || can(permission)
  })
  const enabledSet = new Set<DashboardWidgetKey>(enabled)
  const seen = new Set<DashboardWidgetKey>()
  const result: DashboardWidgetKey[] = []

  for (const key of order) {
    if (enabledSet.has(key) && !seen.has(key)) {
      result.push(key)
      seen.add(key)
    }
  }

  for (const key of enabled) {
    if (!seen.has(key)) {
      result.push(key)
    }
  }

  return result
}

const DASHBOARD_WIDGET_PERMISSIONS: Record<
  DashboardWidgetKey,
  string | null
> = {
  top_technologies: "technologies.view",
  employees_per_application: "assignments.view",
  applications_by_status: "applications.view",
  applications_by_department: "applications.view",
  applications_by_ha_model: "applications.view",
  license_usage: "licenses.view",
  infra_license_usage: "infra-licenses.view",
  service_desk_license_usage: "service-desk-licenses.view",
  network_ops_license_usage: "network-ops-licenses.view",
  smart_facilities_license_usage: "smart-facilities-licenses.view",
  license_status_distribution: "licenses.view",
  licenses_by_environment: "licenses.view",
  recent_activity: "activity-log.view",
  weather: null,
  local_time: null,
  prayer_times: null,
}

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")
  const { can } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const dashboardQuery = useDashboard()
  const [orderOverride, setOrderOverride] = useState<
    DashboardWidgetKey[] | null
  >(null)
  const widgets = settings.dashboard_widgets
  const widgetLayout = useMemo(
    () =>
      normalizeDashboardWidgetLayout(
        settings.dashboard_widget_layout ?? DEFAULT_DASHBOARD_WIDGET_LAYOUT
      ),
    [settings.dashboard_widget_layout]
  )

  const canManageLayout = can("dashboard-layout.manage")
  const layoutQuery = useDashboardLayout(canManageLayout)
  const updateLayoutMutation = useUpdateDashboardLayout()
  const resetLayoutMutation = useResetDashboardLayout()

  const data = dashboardQuery.data
  const totals = data?.totals

  const technologyUsage = data?.charts.technologies_usage ?? []
  const employeesPerApplication = data?.charts.employees_per_application ?? []
  const applicationsByStatus = data?.charts.applications_by_status ?? []
  const applicationsByDepartment =
    data?.charts.applications_by_department ?? []
  const applicationsByHaModel = data?.charts.applications_by_ha_model ?? []
  const licenseUsage = data?.charts.license_usage ?? []
  const infraLicenseUsage = data?.charts.infra_license_usage ?? []
  const serviceDeskLicenseUsage =
    data?.charts.service_desk_license_usage ?? []
  const networkOpsLicenseUsage =
    data?.charts.network_ops_license_usage ?? []
  const smartFacilitiesLicenseUsage =
    data?.charts.smart_facilities_license_usage ?? []
  const licenseStatusDistribution =
    data?.charts.license_status_distribution ?? []
  const licensesByEnvironment = data?.charts.licenses_by_environment ?? []
  const recentActivity = data?.recent_activity ?? []

  const savedOrder = useMemo(
    () => layoutQuery.data?.widget_order ?? [],
    [layoutQuery.data]
  )

  const visibleWidgets = useMemo(
    () => resolveVisibleWidgets(orderOverride ?? savedOrder, widgets, can),
    [can, orderOverride, savedOrder, widgets]
  )

  useEffect(() => {
    if (!layoutQuery.data?.is_custom) {
      setOrderOverride(null)
    }
  }, [layoutQuery.data?.is_custom])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (!over || active.id === over.id) {
        return
      }

      const oldIndex = visibleWidgets.indexOf(active.id as DashboardWidgetKey)
      const newIndex = visibleWidgets.indexOf(over.id as DashboardWidgetKey)

      if (oldIndex < 0 || newIndex < 0) {
        return
      }

      const next = arrayMove(visibleWidgets, oldIndex, newIndex)
      setOrderOverride(next)
      updateLayoutMutation.mutate({ widget_order: next })
    },
    [updateLayoutMutation, visibleWidgets]
  )

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

  if (dashboardQuery.isLoading) {
    return <LoadingSkeleton rows={10} />
  }

  const kpiCards = [
    {
      label: t("dashboard.kpi.applications"),
      value: totals?.applications ?? 0,
      icon: AppWindow,
      to: "/applications-details",
      permission: null as string | null,
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
      permission: "users.view",
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
      permission: "vendors.view",
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
      permission: "technologies.view",
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
      permission: "licenses.view",
      accent: {
        card: "border-cyan-500/20 bg-cyan-500/[0.04] dark:border-cyan-400/25 dark:bg-cyan-400/[0.06]",
        strip: "bg-cyan-500/80 dark:bg-cyan-400/70",
        icon: "text-cyan-600/12 dark:text-cyan-300/15",
      },
    },
  ].filter((item) => item.permission === null || can(item.permission))

  const quickActions = [
    {
      label: t("dashboard.goToAssignments"),
      to: "/assignments",
      permission: "assignments.view",
      variant: "default" as const,
      icon: Link2,
    },
    {
      label: t("dashboard.manageApplications"),
      to: "/applications",
      permission: null as string | null,
      variant: "outline" as const,
      icon: null,
    },
    {
      label: t("dashboard.manageTechnologies"),
      to: "/technologies",
      permission: "technologies.view",
      variant: "outline" as const,
      icon: Cpu,
    },
  ].filter((item) => item.permission === null || can(item.permission))

  function renderWidget(key: DashboardWidgetKey): ReactNode {
    switch (key) {
      case "top_technologies":
        return (
          <DashboardChartCard
            widgetKey="top_technologies"
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
                className="mx-auto aspect-square max-h-[var(--dashboard-chart-height,320px)]"
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
                  <PolarAngleAxis
                    dataKey="technology"
                    tick={CHART_TICK_STYLE}
                  />
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
        )
      case "employees_per_application":
        return <EmployeesDonutChart items={employeesPerApplication} />
      case "applications_by_status":
        return <ApplicationsByStatusChart items={applicationsByStatus} />
      case "applications_by_department":
        return <DepartmentRankingChart items={applicationsByDepartment} />
      case "applications_by_ha_model":
        return <ApplicationsHaModelChart items={applicationsByHaModel} />
      case "license_usage":
        return (
          <LicenseUsageRadialChart
            items={licenseUsage}
            widgetKey="license_usage"
            titleKey="dashboard.charts.appsLicenseUsage"
            descriptionKey="dashboard.charts.appsLicenseUsageDesc"
            accentClassName="from-cyan-500/12 via-transparent to-transparent"
          />
        )
      case "infra_license_usage":
        return (
          <LicenseUsageRadialChart
            items={infraLicenseUsage}
            widgetKey="infra_license_usage"
            titleKey="dashboard.charts.infraLicenseUsage"
            descriptionKey="dashboard.charts.infraLicenseUsageDesc"
            accentClassName="from-violet-500/12 via-transparent to-transparent"
          />
        )
      case "service_desk_license_usage":
        return (
          <LicenseUsageRadialChart
            items={serviceDeskLicenseUsage}
            widgetKey="service_desk_license_usage"
            titleKey="dashboard.charts.sdLicenseUsage"
            descriptionKey="dashboard.charts.sdLicenseUsageDesc"
            accentClassName="from-emerald-500/12 via-transparent to-transparent"
          />
        )
      case "network_ops_license_usage":
        return (
          <LicenseUsageRadialChart
            items={networkOpsLicenseUsage}
            widgetKey="network_ops_license_usage"
            titleKey="dashboard.charts.networkOpsLicenseUsage"
            descriptionKey="dashboard.charts.networkOpsLicenseUsageDesc"
            accentClassName="from-sky-500/12 via-transparent to-transparent"
          />
        )
      case "smart_facilities_license_usage":
        return (
          <LicenseUsageRadialChart
            items={smartFacilitiesLicenseUsage}
            widgetKey="smart_facilities_license_usage"
            titleKey="dashboard.charts.smartFacilitiesLicenseUsage"
            descriptionKey="dashboard.charts.smartFacilitiesLicenseUsageDesc"
            accentClassName="from-teal-500/12 via-transparent to-transparent"
          />
        )
      case "license_status_distribution":
        return <LicenseStatusDonutChart items={licenseStatusDistribution} />
      case "licenses_by_environment":
        return <LicenseEnvironmentBars items={licensesByEnvironment} />
      case "recent_activity":
        return (
          <DashboardChartCard
            widgetKey="recent_activity"
            title={t("dashboard.recentTitle")}
            description={t("dashboard.recentDescription")}
            icon={Activity}
            accentClassName="from-sky-500/12 via-transparent to-transparent"
          >
            {recentActivity.length === 0 ? (
              <EmptyState
                title={t("dashboard.recentEmptyTitle")}
                description={t("dashboard.recentEmptyDescription")}
              />
            ) : (
              <ul className="max-h-[var(--dashboard-chart-height,240px)] space-y-0 overflow-y-auto pe-1">
                {recentActivity.map((activity) => (
                  <li
                    key={activity.id}
                    className="border-b border-stroke py-2.5 last:border-b-0"
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
          </DashboardChartCard>
        )
      default:
        return null
    }
  }

  const board = (
    <DashboardWidgetLayoutContext.Provider value={widgetLayout}>
      <div className={DASHBOARD_BOARD_GRID_CLASS}>
        {visibleWidgets.map((key) => {
          const layoutItem = dashboardWidgetLayoutItem(widgetLayout, key)
          return (
            <SortableDashboardWidget
              key={key}
              id={key}
              className={dashboardWidgetSpanClassFromItem(layoutItem)}
              style={dashboardWidgetShellStyle(layoutItem)}
            >
              {renderWidget(key)}
            </SortableDashboardWidget>
          )
        })}
      </div>
    </DashboardWidgetLayoutContext.Provider>
  )

  return (
    <section className="space-y-6">
      <DashboardLiveHeader
        showWeather={widgets.weather}
        showLocalTime={widgets.local_time}
        showPrayerTimes={widgets.prayer_times}
      />

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

      {canManageLayout && visibleWidgets.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {t("dashboard.layout.hint")}
          </p>
          {layoutQuery.data?.is_custom ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={resetLayoutMutation.isPending}
              onClick={() => {
                resetLayoutMutation.mutate(undefined, {
                  onSuccess: () => setOrderOverride(null),
                })
              }}
            >
              <RotateCcw />
              {t("dashboard.layout.resetLayout")}
            </Button>
          ) : null}
        </div>
      ) : null}

      {visibleWidgets.length === 0 ? (
        <EmptyState
          title={t("dashboard.layout.emptyTitle")}
          description={t("dashboard.layout.emptyDescription")}
        />
      ) : canManageLayout ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={visibleWidgets} strategy={rectSortingStrategy}>
            {board}
          </SortableContext>
        </DndContext>
      ) : (
        board
      )}

      <div className="flex flex-wrap gap-2">
        {quickActions.length > 0 ? (
          quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.to}
                variant={action.variant}
                onClick={() => navigate(action.to)}
              >
                {Icon ? <Icon className="size-4" /> : null}
                {action.label}
              </Button>
            )
          })
        ) : (
          <div className="rounded-xl border border-stroke bg-card p-4 text-sm text-muted-foreground">
            {t("dashboard.needAccess")}
          </div>
        )}
      </div>
    </section>
  )
}
