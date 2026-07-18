export type PublicSettings = {
  authentication_mode: "local" | "sso" | "hybrid"
  company_name: string
  sidebar_tagline_en: string
  sidebar_tagline_ar: string
  header_subtitle_en: string
  header_subtitle_ar: string
  default_timezone: string
  default_pagination_size: number
  session_timeout_minutes: number
  dashboard_widgets: import("@/features/dashboard/types/dashboard-widgets").DashboardWidgetsConfig
  authentication_role_mapping: import("@/features/authentication-settings/types/authentication-settings").AuthenticationRoleMappingSettings
}

export type UpdateSettingsPayload = Partial<
  Omit<PublicSettings, "session_timeout_minutes">
>
