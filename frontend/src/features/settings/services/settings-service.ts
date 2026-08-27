import { api } from "@/lib/axios"
import type { ApiEnvelope } from "@/types/api"
import type {
  PublicSettings,
  UpdateSettingsPayload,
} from "@/features/settings/types/settings"
import {
  DEFAULT_DASHBOARD_WIDGETS,
  normalizeDashboardWidgets,
  normalizeDashboardWidgetsByRole,
  type DashboardWidgetRoleOption,
} from "@/features/dashboard/types/dashboard-widgets"
import {
  DEFAULT_DASHBOARD_WIDGET_LAYOUT,
  normalizeDashboardWidgetLayout,
} from "@/features/dashboard/types/widget-layout-config"

type SettingRecord = {
  key: string
  value: string | number | boolean | null | Record<string, unknown>
}

const DEFAULTS: PublicSettings = {
  company_name: "CENTRIX",
  sidebar_tagline_en: "",
  sidebar_tagline_ar: "",
  header_subtitle_en: "ZATCA Applications Operations",
  header_subtitle_ar:
    "نظام ادارة التطبيقات في هيئة الزكاة والضريبة والجمارك",
  default_timezone: "Asia/Riyadh",
  default_pagination_size: 15,
  session_timeout_minutes: 120,
  login_default_credentials_enabled: true,
  login_default_email: "viewer@zatca.gov.sa",
  login_default_password: "password",
  dashboard_widgets: DEFAULT_DASHBOARD_WIDGETS,
  dashboard_widget_layout: DEFAULT_DASHBOARD_WIDGET_LAYOUT,
}

function asRoleOptions(value: unknown): DashboardWidgetRoleOption[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null
      }
      const record = item as Record<string, unknown>
      const id = Number(record.id)
      const name = typeof record.name === "string" ? record.name : ""
      if (!Number.isFinite(id) || name === "") {
        return null
      }
      return { id, name }
    })
    .filter((item): item is DashboardWidgetRoleOption => item !== null)
}

function asPublicSettings(
  payload: Record<string, unknown> | SettingRecord[] | PublicSettings
): PublicSettings {
  const source: Record<string, unknown> = Array.isArray(payload)
    ? Object.fromEntries(payload.map((item) => [item.key, item.value]))
    : payload

  const roleOptions = asRoleOptions(source.dashboard_widget_roles)
  const byRole =
    source.dashboard_widgets_by_role !== undefined
      ? normalizeDashboardWidgetsByRole(
          source.dashboard_widgets_by_role,
          roleOptions?.map((role) => role.id) ?? []
        )
      : undefined

  return {
    company_name:
      typeof source.company_name === "string"
        ? source.company_name
        : DEFAULTS.company_name,
    sidebar_tagline_en:
      typeof source.sidebar_tagline_en === "string"
        ? source.sidebar_tagline_en
        : DEFAULTS.sidebar_tagline_en,
    sidebar_tagline_ar:
      typeof source.sidebar_tagline_ar === "string"
        ? source.sidebar_tagline_ar
        : DEFAULTS.sidebar_tagline_ar,
    header_subtitle_en:
      typeof source.header_subtitle_en === "string"
        ? source.header_subtitle_en
        : DEFAULTS.header_subtitle_en,
    header_subtitle_ar:
      typeof source.header_subtitle_ar === "string"
        ? source.header_subtitle_ar
        : DEFAULTS.header_subtitle_ar,
    default_timezone:
      typeof source.default_timezone === "string"
        ? source.default_timezone
        : DEFAULTS.default_timezone,
    default_pagination_size:
      typeof source.default_pagination_size === "number"
        ? source.default_pagination_size
        : Number(source.default_pagination_size) ||
          DEFAULTS.default_pagination_size,
    session_timeout_minutes:
      typeof source.session_timeout_minutes === "number"
        ? source.session_timeout_minutes
        : Number(source.session_timeout_minutes) ||
          DEFAULTS.session_timeout_minutes,
    login_default_credentials_enabled: (() => {
      const value = source.login_default_credentials_enabled
      if (typeof value === "boolean") {
        return value
      }
      if (value === 0 || value === "0" || value === "false") {
        return false
      }
      if (value === 1 || value === "1" || value === "true") {
        return true
      }
      return DEFAULTS.login_default_credentials_enabled
    })(),
    login_default_email:
      typeof source.login_default_email === "string"
        ? source.login_default_email
        : DEFAULTS.login_default_email,
    login_default_password:
      typeof source.login_default_password === "string"
        ? source.login_default_password
        : DEFAULTS.login_default_password,
    dashboard_widgets: normalizeDashboardWidgets(source.dashboard_widgets),
    dashboard_widget_layout: normalizeDashboardWidgetLayout(
      source.dashboard_widget_layout
    ),
    ...(byRole !== undefined ? { dashboard_widgets_by_role: byRole } : {}),
    ...(roleOptions !== undefined
      ? { dashboard_widget_roles: roleOptions }
      : {}),
  }
}

export const settingsService = {
  async get(): Promise<PublicSettings> {
    const { data } = await api.get<
      ApiEnvelope<Record<string, unknown> | SettingRecord[]>
    >("/settings/public")
    return asPublicSettings(data.data)
  },

  async update(payload: UpdateSettingsPayload): Promise<PublicSettings> {
    const { data } = await api.put<
      ApiEnvelope<Record<string, unknown> | SettingRecord[]>
    >("/settings", {
      settings: payload,
    })
    return asPublicSettings(data.data)
  },
}
