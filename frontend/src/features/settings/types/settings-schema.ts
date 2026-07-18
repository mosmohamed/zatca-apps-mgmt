import type { TFunction } from "i18next"
import { z } from "zod"

import { DASHBOARD_WIDGET_KEYS } from "@/features/dashboard/types/dashboard-widgets"

export function createSettingsFormSchema(t: TFunction) {
  const dashboardWidgetsShape = Object.fromEntries(
    DASHBOARD_WIDGET_KEYS.map((key) => [key, z.boolean()])
  ) as Record<(typeof DASHBOARD_WIDGET_KEYS)[number], z.ZodBoolean>

  return z.object({
    authentication_mode: z.enum(["local", "sso", "hybrid"]),
    company_name: z
      .string()
      .trim()
      .min(1, t("validation.nameRequired"))
      .max(255),
    sidebar_tagline_en: z
      .string()
      .trim()
      .min(1, t("validation.nameRequired"))
      .max(255),
    sidebar_tagline_ar: z
      .string()
      .trim()
      .min(1, t("validation.nameRequired"))
      .max(255),
    header_subtitle_en: z
      .string()
      .trim()
      .min(1, t("validation.nameRequired"))
      .max(500),
    header_subtitle_ar: z
      .string()
      .trim()
      .min(1, t("validation.nameRequired"))
      .max(500),
    default_timezone: z
      .string()
      .trim()
      .min(1, t("validation.required", { field: t("settings.general.timezone") })),
    default_pagination_size: z.number().int().min(5).max(100),
    dashboard_widgets: z.object(dashboardWidgetsShape),
    authentication_role_mapping: z.object({
      enabled: z.boolean(),
      auto_provisioning: z.boolean(),
      allow_email_account_linking: z.boolean(),
      require_verified_email_for_linking: z.boolean(),
      automatic_department_mapping: z.boolean(),
      department_claim: z.string().trim().max(255),
      default_role_id: z.number().int().positive().nullable(),
      default_user_status: z.enum(["active", "inactive"]),
      update_roles_on_login: z.boolean(),
      update_user_information_on_login: z.boolean(),
      multi_match_strategy: z.enum(["multiple", "highest_priority"]),
      sync_fields: z.object({
        first_name: z.boolean(),
        last_name: z.boolean(),
        email: z.boolean(),
        username: z.boolean(),
        employee_id: z.boolean(),
        department: z.boolean(),
        job_title: z.boolean(),
        profile_picture: z.boolean(),
      }),
    }),
  })
}

export type SettingsFormValues = z.infer<
  ReturnType<typeof createSettingsFormSchema>
>
