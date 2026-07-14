import { api } from "@/lib/axios"
import type { ApiEnvelope } from "@/types/api"

export type DashboardTotals = {
  applications: number
  active_users: number
  vendors: number
  technologies: number
  assignments: number
  open_assignments: number
}

export type DashboardChartItem = {
  name: string
  count: number
}

export type DashboardActivity = {
  id: number
  description: string
  event: string | null
  log_name: string | null
  created_at: string | null
  causer: {
    id: number
    type: string
    name: string
  } | null
  subject: {
    id: number
    type: string
  } | null
}

export type DashboardData = {
  totals: DashboardTotals
  charts: {
    applications_by_status: DashboardChartItem[]
    assignments_by_app_role: DashboardChartItem[]
    technologies_usage: DashboardChartItem[]
    employees_per_application: DashboardChartItem[]
    applications_by_department: DashboardChartItem[]
  }
  recent_activity: DashboardActivity[]
}

export const dashboardService = {
  async get(): Promise<DashboardData> {
    const { data } = await api.get<ApiEnvelope<DashboardData>>("/dashboard")
    return data.data
  },
}
