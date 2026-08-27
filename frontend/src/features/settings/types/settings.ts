export type PublicSettings = {
  company_name: string
  sidebar_tagline_en: string
  sidebar_tagline_ar: string
  header_subtitle_en: string
  header_subtitle_ar: string
  default_timezone: string
  default_pagination_size: number
  session_timeout_minutes: number
  login_default_credentials_enabled: boolean
  login_default_email: string
  login_default_password: string
  /** Effective widgets for the current authenticated user (or defaults when guest). */
  dashboard_widgets: import("@/features/dashboard/types/dashboard-widgets").DashboardWidgetsConfig
  /** Org-wide widget presentation (spans, chrome, chart heights). Separate from user order. */
  dashboard_widget_layout: import("@/features/dashboard/types/widget-layout-config").DashboardWidgetLayoutConfig
  /** Present for users with settings.update — per-role visibility maps. */
  dashboard_widgets_by_role?: import("@/features/dashboard/types/dashboard-widgets").DashboardWidgetsByRole
  /** Present for users with settings.update — dynamic role list for the settings UI. */
  dashboard_widget_roles?: import("@/features/dashboard/types/dashboard-widgets").DashboardWidgetRoleOption[]
}

export type UpdateSettingsPayload = Partial<
  Omit<
    PublicSettings,
    | "session_timeout_minutes"
    | "dashboard_widgets"
    | "dashboard_widgets_by_role"
    | "dashboard_widget_roles"
  > & {
    dashboard_widgets?:
      | import("@/features/dashboard/types/dashboard-widgets").DashboardWidgetsConfig
      | {
          roles: import("@/features/dashboard/types/dashboard-widgets").DashboardWidgetsByRole
        }
    dashboard_widget_layout?: import("@/features/dashboard/types/widget-layout-config").DashboardWidgetLayoutConfig
  }
>
