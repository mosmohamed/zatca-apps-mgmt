import { api } from "@/lib/axios"
import type { ApiEnvelope } from "@/types/api"
import type {
  ApplicationTypeSummary,
  DepartmentSummary,
  LookupItem,
} from "@/features/applications/types/application"
import type { Technology } from "@/features/technologies/types/technology"

export type AppRoleSummary = {
  id: number
  name: string
  description?: string | null
  is_active?: boolean
  sort_order?: number
}

export type JobTitleSummary = {
  id: number
  name_en: string
  name_ar: string
  description?: string | null
  is_active?: boolean
  sort_order?: number
}

export const lookupsService = {
  async departments(): Promise<DepartmentSummary[]> {
    const { data } = await api.get<ApiEnvelope<DepartmentSummary[]>>(
      "/lookups/departments"
    )
    return data.data
  },

  async applicationTypes(): Promise<ApplicationTypeSummary[]> {
    const { data } = await api.get<ApiEnvelope<ApplicationTypeSummary[]>>(
      "/lookups/application-types"
    )
    return data.data
  },

  async appRoles(): Promise<AppRoleSummary[]> {
    const { data } = await api.get<ApiEnvelope<AppRoleSummary[]>>(
      "/lookups/app-roles"
    )
    return data.data
  },

  async jobTitles(): Promise<JobTitleSummary[]> {
    const { data } = await api.get<ApiEnvelope<JobTitleSummary[]>>(
      "/lookups/job-titles"
    )
    return data.data
  },

  async supportTypes(): Promise<LookupItem[]> {
    const { data } = await api.get<ApiEnvelope<LookupItem[]>>(
      "/lookups/support-types"
    )
    return data.data
  },

  async criticalities(): Promise<LookupItem[]> {
    const { data } = await api.get<ApiEnvelope<LookupItem[]>>(
      "/lookups/criticalities"
    )
    return data.data
  },

  async applicationStatuses(): Promise<LookupItem[]> {
    const { data } = await api.get<ApiEnvelope<LookupItem[]>>(
      "/lookups/application-statuses"
    )
    return data.data
  },

  async technologies(): Promise<Technology[]> {
    const { data } = await api.get<ApiEnvelope<Technology[]>>(
      "/lookups/technologies"
    )
    return data.data
  },
}
