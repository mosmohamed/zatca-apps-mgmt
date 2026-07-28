import { createContext, useContext } from "react"

import type { DashboardWidgetKey } from "@/features/dashboard/types/dashboard-widgets"
import {
  DEFAULT_DASHBOARD_WIDGET_LAYOUT,
  type DashboardWidgetLayoutConfig,
  type DashboardWidgetLayoutItem,
} from "@/features/dashboard/types/widget-layout-config"

export const DashboardWidgetLayoutContext =
  createContext<DashboardWidgetLayoutConfig>(DEFAULT_DASHBOARD_WIDGET_LAYOUT)

export function useDashboardWidgetLayout(): DashboardWidgetLayoutConfig {
  return useContext(DashboardWidgetLayoutContext)
}

export function useDashboardWidgetLayoutItem(
  key: DashboardWidgetKey
): DashboardWidgetLayoutItem {
  const layout = useDashboardWidgetLayout()
  return layout.widgets[key] ?? DEFAULT_DASHBOARD_WIDGET_LAYOUT.widgets[key]
}
