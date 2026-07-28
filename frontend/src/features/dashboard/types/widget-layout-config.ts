import {
  DASHBOARD_WIDGET_KEYS,
  type DashboardWidgetKey,
} from "@/features/dashboard/types/dashboard-widgets"

export const WIDGET_DESKTOP_SPANS = [1, 2, 3, 4, 5, 6] as const
export const WIDGET_TABLET_SPANS = [1, 2] as const
export const WIDGET_OVERFLOWS = ["auto", "hidden", "visible"] as const
export const WIDGET_LEGEND_POSITIONS = ["bottom", "top", "hidden"] as const

export type WidgetDesktopSpan = (typeof WIDGET_DESKTOP_SPANS)[number]
export type WidgetTabletSpan = (typeof WIDGET_TABLET_SPANS)[number]
export type WidgetOverflow = (typeof WIDGET_OVERFLOWS)[number]
export type WidgetLegendPosition = (typeof WIDGET_LEGEND_POSITIONS)[number]

/** Convenience presets mapped to desktop column spans on the 6-col grid. */
export type WidgetSizePreset = "full" | "half" | "third" | "custom"

export type DashboardWidgetLayoutItem = {
  span_desktop: WidgetDesktopSpan
  span_tablet: WidgetTabletSpan
  span_mobile: 1
  min_height_px: number
  max_height_px: number | null
  chart_height_px: number
  overflow: WidgetOverflow
  show_header: boolean
  show_description: boolean
  show_legend: boolean
  show_filters: boolean
  show_statistics: boolean
  legend_position: WidgetLegendPosition
}

export type DashboardWidgetLayoutConfig = {
  default_order: DashboardWidgetKey[]
  widgets: Record<DashboardWidgetKey, DashboardWidgetLayoutItem>
}

const DEFAULT_SPANS: Record<DashboardWidgetKey, WidgetDesktopSpan> = {
  top_technologies: 3,
  employees_per_application: 3,
  applications_by_status: 2,
  applications_by_department: 2,
  applications_by_ha_model: 2,
  license_usage: 2,
  license_status_distribution: 2,
  licenses_by_environment: 2,
  recent_activity: 2,
  weather: 6,
  local_time: 6,
  prayer_times: 6,
}

function baseItem(spanDesktop: WidgetDesktopSpan): DashboardWidgetLayoutItem {
  return {
    span_desktop: spanDesktop,
    span_tablet: spanDesktop >= 6 ? 2 : 1,
    span_mobile: 1,
    min_height_px: 280,
    max_height_px: null,
    chart_height_px: 240,
    overflow: "auto",
    show_header: true,
    show_description: true,
    show_legend: true,
    show_filters: true,
    show_statistics: true,
    legend_position: "bottom",
  }
}

export function createDefaultDashboardWidgetLayout(): DashboardWidgetLayoutConfig {
  const widgets = {} as Record<DashboardWidgetKey, DashboardWidgetLayoutItem>
  for (const key of DASHBOARD_WIDGET_KEYS) {
    widgets[key] = baseItem(DEFAULT_SPANS[key])
  }
  return {
    default_order: [...DASHBOARD_WIDGET_KEYS],
    widgets,
  }
}

export function createRecommendedDashboardWidgetLayout(): DashboardWidgetLayoutConfig {
  const config = createDefaultDashboardWidgetLayout()
  config.widgets.recent_activity = {
    ...config.widgets.recent_activity,
    span_desktop: 3,
    span_tablet: 1,
  }
  return config
}

export const DEFAULT_DASHBOARD_WIDGET_LAYOUT =
  createDefaultDashboardWidgetLayout()

export function sizePresetForSpan(span: WidgetDesktopSpan): WidgetSizePreset {
  if (span === 6) return "full"
  if (span === 3) return "half"
  if (span === 2) return "third"
  return "custom"
}

export function spanForSizePreset(preset: WidgetSizePreset): WidgetDesktopSpan | null {
  switch (preset) {
    case "full":
      return 6
    case "half":
      return 3
    case "third":
      return 2
    default:
      return null
  }
}

function asDesktopSpan(value: unknown, fallback: WidgetDesktopSpan): WidgetDesktopSpan {
  const n = Number(value)
  return (WIDGET_DESKTOP_SPANS as readonly number[]).includes(n)
    ? (n as WidgetDesktopSpan)
    : fallback
}

function asTabletSpan(value: unknown, fallback: WidgetTabletSpan): WidgetTabletSpan {
  const n = Number(value)
  return (WIDGET_TABLET_SPANS as readonly number[]).includes(n)
    ? (n as WidgetTabletSpan)
    : fallback
}

function asOverflow(value: unknown, fallback: WidgetOverflow): WidgetOverflow {
  return typeof value === "string" &&
    (WIDGET_OVERFLOWS as readonly string[]).includes(value)
    ? (value as WidgetOverflow)
    : fallback
}

function asLegendPosition(
  value: unknown,
  fallback: WidgetLegendPosition
): WidgetLegendPosition {
  return typeof value === "string" &&
    (WIDGET_LEGEND_POSITIONS as readonly string[]).includes(value)
    ? (value as WidgetLegendPosition)
    : fallback
}

function boundedInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, Math.round(n)))
}

function normalizeOrder(value: unknown): DashboardWidgetKey[] {
  const known = new Set<string>(DASHBOARD_WIDGET_KEYS)
  const ordered: DashboardWidgetKey[] = []

  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string" && known.has(item) && !ordered.includes(item as DashboardWidgetKey)) {
        ordered.push(item as DashboardWidgetKey)
      }
    }
  }

  for (const key of DASHBOARD_WIDGET_KEYS) {
    if (!ordered.includes(key)) {
      ordered.push(key)
    }
  }

  return ordered
}

function normalizeWidgetItem(
  raw: unknown,
  base: DashboardWidgetLayoutItem
): DashboardWidgetLayoutItem {
  const source =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {}

  const minHeight = boundedInt(source.min_height_px, 160, 800, base.min_height_px)
  let maxHeight: number | null = null
  if (
    source.max_height_px !== null &&
    source.max_height_px !== undefined &&
    source.max_height_px !== "" &&
    source.max_height_px !== 0
  ) {
    maxHeight = boundedInt(source.max_height_px, minHeight, 1600, Math.max(minHeight, 480))
  }

  return {
    span_desktop: asDesktopSpan(source.span_desktop, base.span_desktop),
    span_tablet: asTabletSpan(source.span_tablet, base.span_tablet),
    span_mobile: 1,
    min_height_px: minHeight,
    max_height_px: maxHeight,
    chart_height_px: boundedInt(
      source.chart_height_px,
      120,
      640,
      base.chart_height_px
    ),
    overflow: asOverflow(source.overflow, base.overflow),
    show_header:
      "show_header" in source ? Boolean(source.show_header) : base.show_header,
    show_description:
      "show_description" in source
        ? Boolean(source.show_description)
        : base.show_description,
    show_legend:
      "show_legend" in source ? Boolean(source.show_legend) : base.show_legend,
    show_filters:
      "show_filters" in source ? Boolean(source.show_filters) : base.show_filters,
    show_statistics:
      "show_statistics" in source
        ? Boolean(source.show_statistics)
        : base.show_statistics,
    legend_position: asLegendPosition(
      source.legend_position,
      base.legend_position
    ),
  }
}

export function normalizeDashboardWidgetLayout(
  value: unknown
): DashboardWidgetLayoutConfig {
  const defaults = createDefaultDashboardWidgetLayout()

  if (typeof value === "string") {
    try {
      value = JSON.parse(value)
    } catch {
      return defaults
    }
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaults
  }

  const source = value as Record<string, unknown>
  const incomingWidgets =
    source.widgets && typeof source.widgets === "object" && !Array.isArray(source.widgets)
      ? (source.widgets as Record<string, unknown>)
      : {}

  const widgets = {} as Record<DashboardWidgetKey, DashboardWidgetLayoutItem>
  for (const key of DASHBOARD_WIDGET_KEYS) {
    widgets[key] = normalizeWidgetItem(incomingWidgets[key], defaults.widgets[key])
  }

  return {
    default_order: normalizeOrder(source.default_order),
    widgets,
  }
}
