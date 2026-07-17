import { api } from "@/lib/axios"
import type { ApiEnvelope } from "@/types/api"
import type {
  PublicSettings,
  UpdateSettingsPayload,
} from "@/features/settings/types/settings"
import {
  DEFAULT_DASHBOARD_WIDGETS,
  normalizeDashboardWidgets,
} from "@/features/dashboard/types/dashboard-widgets"

type SettingRecord = {
  key: string
  value: string | number | boolean | null | Record<string, unknown>
}

const DEFAULTS: PublicSettings = {
  company_name: "IT Portfolio System",
  sidebar_tagline_en: "Access Management",
  sidebar_tagline_ar: "إدارة الصلاحيات",
  header_subtitle_en: "ZATCA Applications Operations & Access Management",
  header_subtitle_ar:
    "نظام ادارة التطبيقات وإدارة الصلاحيات في هيئة الزكاة والضريبة والجمارك",
  default_timezone: "Asia/Riyadh",
  default_pagination_size: 15,
  session_timeout_minutes: 120,
  dashboard_widgets: DEFAULT_DASHBOARD_WIDGETS,
}

function asPublicSettings(
  payload: Record<string, unknown> | SettingRecord[] | PublicSettings
): PublicSettings {
  const source: Record<string, unknown> = Array.isArray(payload)
    ? Object.fromEntries(payload.map((item) => [item.key, item.value]))
    : payload

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
    dashboard_widgets: normalizeDashboardWidgets(source.dashboard_widgets),
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
