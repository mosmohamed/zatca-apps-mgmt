import type { TFunction } from "i18next"
import { z } from "zod"

import { DASHBOARD_WIDGET_KEYS } from "@/features/dashboard/types/dashboard-widgets"

export function createSettingsFormSchema(t: TFunction) {
  const dashboardWidgetsShape = Object.fromEntries(
    DASHBOARD_WIDGET_KEYS.map((key) => [key, z.boolean()])
  ) as Record<(typeof DASHBOARD_WIDGET_KEYS)[number], z.ZodBoolean>

  return z.object({
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
    dashboard_widgets_by_role: z.record(
      z.string(),
      z.object(dashboardWidgetsShape)
    ),
  })
}

export type SettingsFormValues = z.infer<
  ReturnType<typeof createSettingsFormSchema>
>
