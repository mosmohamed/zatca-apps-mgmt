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
  "weather",
  "local_time",
  "prayer_times",
] as const

export const DASHBOARD_HEADER_WIDGET_KEYS = [
  "weather",
  "local_time",
  "prayer_times",
] as const

export type DashboardWidgetKey = (typeof DASHBOARD_WIDGET_KEYS)[number]

export type DashboardWidgetsConfig = Record<DashboardWidgetKey, boolean>

export type DashboardWidgetRoleOption = {
  id: number
  name: string
}

export type DashboardWidgetsByRole = Record<string, DashboardWidgetsConfig>

export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidgetsConfig =
  Object.fromEntries(
    DASHBOARD_WIDGET_KEYS.map((key) => [
      key,
      !(DASHBOARD_HEADER_WIDGET_KEYS as readonly string[]).includes(key),
    ])
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

  // Ignore role-scoped payloads mistaken for a flat map.
  if ("roles" in value) {
    return next
  }

  for (const key of DASHBOARD_WIDGET_KEYS) {
    if (key in value) {
      next[key] = Boolean((value as Record<string, unknown>)[key])
    }
  }

  return next
}

export function normalizeDashboardWidgetsByRole(
  value: unknown,
  roleIds: Array<number | string> = []
): DashboardWidgetsByRole {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}

  const result: DashboardWidgetsByRole = {}
  const ids =
    roleIds.length > 0
      ? roleIds.map(String)
      : Object.keys(source)

  for (const roleId of ids) {
    result[roleId] = normalizeDashboardWidgets(source[roleId] ?? null)
  }

  return result
}
