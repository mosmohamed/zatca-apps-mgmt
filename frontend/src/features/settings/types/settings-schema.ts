import type { TFunction } from "i18next"
import { z } from "zod"

import { DASHBOARD_WIDGET_KEYS } from "@/features/dashboard/types/dashboard-widgets"
import {
  WIDGET_LEGEND_POSITIONS,
  WIDGET_OVERFLOWS,
} from "@/features/dashboard/types/widget-layout-config"

export function createSettingsFormSchema(t: TFunction) {
  const dashboardWidgetKeySchema = z.enum(DASHBOARD_WIDGET_KEYS)

  const dashboardWidgetsShape = Object.fromEntries(
    DASHBOARD_WIDGET_KEYS.map((key) => [key, z.boolean()])
  ) as Record<(typeof DASHBOARD_WIDGET_KEYS)[number], z.ZodBoolean>

  const widgetLayoutItemSchema = z.object({
    span_desktop: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
    ]),
    span_tablet: z.union([z.literal(1), z.literal(2)]),
    span_mobile: z.literal(1),
    min_height_px: z.number().int().min(160).max(800),
    max_height_px: z.number().int().min(160).max(1600).nullable(),
    chart_height_px: z.number().int().min(120).max(640),
    overflow: z.enum(WIDGET_OVERFLOWS),
    show_header: z.boolean(),
    show_description: z.boolean(),
    show_legend: z.boolean(),
    show_filters: z.boolean(),
    show_statistics: z.boolean(),
    legend_position: z.enum(WIDGET_LEGEND_POSITIONS),
  })

  const widgetsShape = Object.fromEntries(
    DASHBOARD_WIDGET_KEYS.map((key) => [key, widgetLayoutItemSchema])
  ) as Record<
    (typeof DASHBOARD_WIDGET_KEYS)[number],
    typeof widgetLayoutItemSchema
  >

  return z.object({
    company_name: z
      .string()
      .trim()
      .min(1, t("validation.nameRequired"))
      .max(255),
    sidebar_tagline_en: z.string().trim().max(255),
    sidebar_tagline_ar: z.string().trim().max(255),
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
    dashboard_widget_layout: z.object({
      default_order: z.array(dashboardWidgetKeySchema).min(1),
      widgets: z.object(widgetsShape),
    }),
  })
}

export type SettingsFormValues = z.infer<
  ReturnType<typeof createSettingsFormSchema>
>
