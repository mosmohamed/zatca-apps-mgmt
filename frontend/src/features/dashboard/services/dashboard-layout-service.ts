import { api } from "@/lib/axios"
import type { ApiEnvelope } from "@/types/api"
import type { DashboardWidgetKey } from "@/features/dashboard/types/dashboard-widgets"

export type DashboardLayout = {
  widget_order: DashboardWidgetKey[]
  is_custom: boolean
}

export type UpdateDashboardLayoutPayload = {
  widget_order: DashboardWidgetKey[]
}

export const dashboardLayoutService = {
  async get(): Promise<DashboardLayout> {
    const { data } = await api.get<ApiEnvelope<DashboardLayout>>(
      "/dashboard/layout"
    )
    return data.data
  },

  async update(payload: UpdateDashboardLayoutPayload): Promise<DashboardLayout> {
    const { data } = await api.put<ApiEnvelope<DashboardLayout>>(
      "/dashboard/layout",
      payload
    )
    return data.data
  },

  async reset(): Promise<DashboardLayout> {
    const { data } = await api.delete<ApiEnvelope<DashboardLayout>>(
      "/dashboard/layout"
    )
    return data.data
  },
}
