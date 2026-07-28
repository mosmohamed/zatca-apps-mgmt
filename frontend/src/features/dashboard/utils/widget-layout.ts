import type { CSSProperties } from "react"

import type { DashboardWidgetKey } from "@/features/dashboard/types/dashboard-widgets"
import {
  DEFAULT_DASHBOARD_WIDGET_LAYOUT,
  type DashboardWidgetLayoutConfig,
  type DashboardWidgetLayoutItem,
  type WidgetDesktopSpan,
  type WidgetTabletSpan,
} from "@/features/dashboard/types/widget-layout-config"

/**
 * Span units on a 6-column xl grid:
 * - 6 = full width
 * - 3 = half width (two per row)
 * - 2 = third width (three per row)
 *
 * Kept as a fallback when settings have not loaded yet.
 */
export const DASHBOARD_WIDGET_SPAN: Record<DashboardWidgetKey, WidgetDesktopSpan> =
  Object.fromEntries(
    Object.entries(DEFAULT_DASHBOARD_WIDGET_LAYOUT.widgets).map(([key, item]) => [
      key,
      item.span_desktop,
    ])
  ) as Record<DashboardWidgetKey, WidgetDesktopSpan>

export function dashboardWidgetSpanClassFromItem(
  item: Pick<DashboardWidgetLayoutItem, "span_desktop" | "span_tablet" | "span_mobile">
): string {
  const desktopMap: Record<WidgetDesktopSpan, string> = {
    1: "xl:col-span-1",
    2: "xl:col-span-2",
    3: "xl:col-span-3",
    4: "xl:col-span-4",
    5: "xl:col-span-5",
    6: "xl:col-span-6",
  }
  const tabletMap: Record<WidgetTabletSpan, string> = {
    1: "md:col-span-1",
    2: "md:col-span-2",
  }

  return `col-span-1 ${tabletMap[item.span_tablet]} ${desktopMap[item.span_desktop]}`
}

/** @deprecated Prefer dashboardWidgetSpanClassFromItem with live layout config. */
export function dashboardWidgetSpanClass(key: DashboardWidgetKey): string {
  const item = DEFAULT_DASHBOARD_WIDGET_LAYOUT.widgets[key]
  return dashboardWidgetSpanClassFromItem(item)
}

export function dashboardWidgetLayoutItem(
  layout: DashboardWidgetLayoutConfig | null | undefined,
  key: DashboardWidgetKey
): DashboardWidgetLayoutItem {
  return layout?.widgets[key] ?? DEFAULT_DASHBOARD_WIDGET_LAYOUT.widgets[key]
}

export function dashboardWidgetShellStyle(
  item: DashboardWidgetLayoutItem
): CSSProperties {
  const style: CSSProperties = {
    minHeight: item.min_height_px,
  }

  if (item.max_height_px != null) {
    style.maxHeight = item.max_height_px
  }

  return style
}

export function dashboardWidgetContentOverflowClass(
  overflow: DashboardWidgetLayoutItem["overflow"]
): string {
  switch (overflow) {
    case "hidden":
      return "overflow-hidden"
    case "visible":
      return "overflow-visible"
    default:
      return "overflow-auto"
  }
}

export function isValidDesktopSpan(value: number): value is WidgetDesktopSpan {
  return [1, 2, 3, 4, 5, 6].includes(value)
}

export function isValidTabletSpan(value: number): value is WidgetTabletSpan {
  return value === 1 || value === 2
}

export const DASHBOARD_BOARD_GRID_CLASS =
  "grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6"
