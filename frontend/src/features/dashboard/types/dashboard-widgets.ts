export const DASHBOARD_WIDGET_KEYS = [
  "top_technologies",
  "employees_per_application",
  "applications_by_status",
  "applications_by_department",
  "applications_by_ha_model",
  "license_usage",
  "license_status_distribution",
  "licenses_by_environment",
  "recent_activity",
] as const

export type DashboardWidgetKey = (typeof DASHBOARD_WIDGET_KEYS)[number]

export type DashboardWidgetsConfig = Record<DashboardWidgetKey, boolean>

export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidgetsConfig =
  Object.fromEntries(
    DASHBOARD_WIDGET_KEYS.map((key) => [key, true])
  ) as DashboardWidgetsConfig

export function normalizeDashboardWidgets(
  value: unknown
): DashboardWidgetsConfig {
  const next = { ...DEFAULT_DASHBOARD_WIDGETS }

  if (typeof value === "string") {
    try {
      value = JSON.parse(value)
    } catch {
      return next
    }
  }

  if (!value || typeof value !== "object") {
    return next
  }

  for (const key of DASHBOARD_WIDGET_KEYS) {
    if (key in value) {
      next[key] = Boolean((value as Record<string, unknown>)[key])
    }
  }

  return next
}
