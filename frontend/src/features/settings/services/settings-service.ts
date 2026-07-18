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
import type { AuthenticationRoleMappingSettings } from "@/features/authentication-settings/types/authentication-settings"

type SettingRecord = {
  key: string
  value: string | number | boolean | null | Record<string, unknown>
}

const DEFAULT_AUTHENTICATION_ROLE_MAPPING: AuthenticationRoleMappingSettings = {
  enabled: false,
  auto_provisioning: false,
  allow_email_account_linking: false,
  require_verified_email_for_linking: true,
  automatic_department_mapping: false,
  department_claim: "department",
  default_role_id: null,
  default_user_status: "active",
  update_roles_on_login: true,
  update_user_information_on_login: true,
  multi_match_strategy: "multiple",
  sync_fields: {
    first_name: true,
    last_name: true,
    email: true,
    username: true,
    employee_id: true,
    department: true,
    job_title: true,
    profile_picture: true,
  },
}

const DEFAULTS: PublicSettings = {
  authentication_mode: "hybrid",
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
  authentication_role_mapping: DEFAULT_AUTHENTICATION_ROLE_MAPPING,
}

function normalizeAuthenticationSettings(value: unknown): AuthenticationRoleMappingSettings {
  if (!value || typeof value !== "object") return DEFAULT_AUTHENTICATION_ROLE_MAPPING
  const source = value as Partial<AuthenticationRoleMappingSettings>
  const defaultUserStatus = (value as Record<string, unknown>).default_user_status
  return {
    ...DEFAULT_AUTHENTICATION_ROLE_MAPPING,
    ...source,
    default_role_id:
      source.default_role_id === null || typeof source.default_role_id === "number"
        ? source.default_role_id
        : DEFAULT_AUTHENTICATION_ROLE_MAPPING.default_role_id,
    default_user_status:
      defaultUserStatus === "inactive" || defaultUserStatus === false
        ? "inactive"
        : "active",
    multi_match_strategy:
      source.multi_match_strategy === "highest_priority"
        ? "highest_priority"
        : "multiple",
    sync_fields: {
      ...DEFAULT_AUTHENTICATION_ROLE_MAPPING.sync_fields,
      ...(source.sync_fields ?? {}),
    },
  }
}

function asPublicSettings(
  payload: Record<string, unknown> | SettingRecord[] | PublicSettings
): PublicSettings {
  const source: Record<string, unknown> = Array.isArray(payload)
    ? Object.fromEntries(payload.map((item) => [item.key, item.value]))
    : payload

  return {
    authentication_mode:
      source.authentication_mode === "sso" ||
      source.authentication_mode === "hybrid"
        ? source.authentication_mode
        : DEFAULTS.authentication_mode,
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
    authentication_role_mapping: normalizeAuthenticationSettings(
      source.authentication_role_mapping
    ),
  }
}

export const settingsService = {
  async get(includeProtected = false): Promise<PublicSettings> {
    const { data } = await api.get<
      ApiEnvelope<Record<string, unknown> | SettingRecord[]>
    >(includeProtected ? "/settings" : "/settings/public")
    return asPublicSettings(data.data)
  },

  async update(payload: UpdateSettingsPayload): Promise<PublicSettings> {
    const authentication = payload.authentication_role_mapping
    const backendPayload = authentication
      ? {
          ...payload,
          authentication_role_mapping: {
            ...authentication,
            default_user_status: authentication.default_user_status === "active",
          },
        }
      : payload
    const { data } = await api.put<
      ApiEnvelope<Record<string, unknown> | SettingRecord[]>
    >("/settings", {
      settings: backendPayload,
    })
    const updated = asPublicSettings(data.data)
    return {
      ...updated,
      ...(payload.authentication_mode
        ? { authentication_mode: payload.authentication_mode }
        : {}),
      ...(authentication
        ? { authentication_role_mapping: authentication }
        : {}),
    }
  },
}
