import { api } from "@/lib/axios"
import type {
  ServiceDeskCategory,
  ServiceDeskCategoryListParams,
  ServiceDeskCategoryPayload,
  ServiceDeskCategoryStatistics,
  ServiceDeskLevel,
  ServiceDeskLevelListParams,
  ServiceDeskLevelPayload,
  ServiceDeskTeamAssignment,
  ServiceDeskTeamAssignmentListParams,
  ServiceDeskTeamAssignmentPayload,
  ServiceDeskTeamAssignmentStatistics,
  ServiceDeskTeamAssignmentUpdatePayload,
  ServiceDeskTeamsDetailsCard,
  ServiceDeskCategoryAssignmentMatrix,
  ServiceDeskCategoryAssignmentSummary,
} from "@/features/service-desk/types/service-desk"
import type { ApiEnvelope, ListQueryParams, PaginatedData } from "@/types/api"

function extractDownloadFilename(
  contentDisposition: string | undefined,
  fallback: string
): string {
  if (!contentDisposition) {
    return fallback
  }

  const encodedMatch = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition)
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1])
    } catch {
      // fall through
    }
  }

  const plainMatch = /filename="?([^";]+)"?/i.exec(contentDisposition)
  return plainMatch?.[1] ?? fallback
}

function toLevelQuery(
  params: ServiceDeskLevelListParams
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.per_page ?? 15,
  }

  if (params.search?.trim()) {
    query.search = params.search.trim()
  }
  if (params.sort) {
    query.sort = params.sort
  }
  if (params.active_only) {
    query.active_only = true
  }
  return query
}

function toCategoryQuery(
  params: ServiceDeskCategoryListParams
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.per_page ?? 15,
  }

  if (params.search?.trim()) {
    query.search = params.search.trim()
  }
  if (params.sort) {
    query.sort = params.sort
  }
  if (params.roots_only) {
    query.roots_only = true
  }
  if (params.parent_id !== undefined && params.parent_id !== null) {
    query.parent_id = params.parent_id
  }
  if (params.active_only) {
    query.active_only = true
  }
  if (params.category_type) {
    query.category_type = params.category_type
  }
  if (params.active_status) {
    query.active_status = params.active_status
  }

  return query
}

function toAssignmentQuery(
  params: ServiceDeskTeamAssignmentListParams
): Record<string, string | number> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    per_page: params.per_page ?? 15,
  }

  if (params.search?.trim()) {
    query.search = params.search.trim()
  }
  if (params.sort) {
    query.sort = params.sort
  }
  if (params.service_desk_category_id) {
    query.service_desk_category_id = params.service_desk_category_id
  }
  if (params.service_desk_level_id) {
    query.service_desk_level_id = params.service_desk_level_id
  }
  if (params.user_id) {
    query.user_id = params.user_id
  }

  return query
}

export const serviceDeskLevelsService = {
  async list(
    params: ServiceDeskLevelListParams = {}
  ): Promise<PaginatedData<ServiceDeskLevel>> {
    const { data } = await api.get<ApiEnvelope<PaginatedData<ServiceDeskLevel>>>(
      "/service-desk-levels",
      { params: toLevelQuery(params) }
    )
    return data.data
  },

  async create(payload: ServiceDeskLevelPayload): Promise<ServiceDeskLevel> {
    const { data } = await api.post<ApiEnvelope<ServiceDeskLevel>>(
      "/service-desk-levels",
      payload
    )
    return data.data
  },

  async update(id: number, payload: ServiceDeskLevelPayload): Promise<ServiceDeskLevel> {
    const { data } = await api.put<ApiEnvelope<ServiceDeskLevel>>(
      `/service-desk-levels/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/service-desk-levels/${id}`)
  },
}

export const serviceDeskCategoriesService = {
  async statistics(): Promise<ServiceDeskCategoryStatistics> {
    const { data } = await api.get<ApiEnvelope<ServiceDeskCategoryStatistics>>(
      "/service-desk-categories/statistics"
    )
    return data.data
  },

  async list(
    params: ServiceDeskCategoryListParams = {}
  ): Promise<PaginatedData<ServiceDeskCategory>> {
    const { data } = await api.get<ApiEnvelope<PaginatedData<ServiceDeskCategory>>>(
      "/service-desk-categories",
      { params: toCategoryQuery(params) }
    )
    return data.data
  },

  async tree(activeOnly = false): Promise<ServiceDeskCategory[]> {
    const { data } = await api.get<ApiEnvelope<ServiceDeskCategory[]>>(
      "/service-desk-categories/tree",
      { params: activeOnly ? { active_only: true } : undefined }
    )
    return data.data
  },

  async create(payload: ServiceDeskCategoryPayload): Promise<ServiceDeskCategory> {
    const { data } = await api.post<ApiEnvelope<ServiceDeskCategory>>(
      "/service-desk-categories",
      payload
    )
    return data.data
  },

  async update(
    id: number,
    payload: ServiceDeskCategoryPayload
  ): Promise<ServiceDeskCategory> {
    const { data } = await api.put<ApiEnvelope<ServiceDeskCategory>>(
      `/service-desk-categories/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/service-desk-categories/${id}`)
  },
}

export const serviceDeskTeamAssignmentsService = {
  async statistics(): Promise<ServiceDeskTeamAssignmentStatistics> {
    const { data } = await api.get<ApiEnvelope<ServiceDeskTeamAssignmentStatistics>>(
      "/service-desk-team-assignments/statistics"
    )
    return data.data
  },

  async categoriesSummary(
    params: ListQueryParams = {}
  ): Promise<PaginatedData<ServiceDeskCategoryAssignmentSummary>> {
    const query: Record<string, string | number> = {
      page: params.page ?? 1,
      per_page: params.per_page ?? 15,
    }
    if (params.search?.trim()) query.search = params.search.trim()
    if (params.sort) query.sort = params.sort

    const { data } = await api.get<
      ApiEnvelope<PaginatedData<ServiceDeskCategoryAssignmentSummary>>
    >("/service-desk-team-assignments/categories-summary", { params: query })
    return data.data
  },

  async categoryMatrix(
    categoryId: number
  ): Promise<ServiceDeskCategoryAssignmentMatrix> {
    const { data } = await api.get<ApiEnvelope<ServiceDeskCategoryAssignmentMatrix>>(
      `/service-desk-team-assignments/category/${categoryId}`
    )
    return data.data
  },

  async list(
    params: ServiceDeskTeamAssignmentListParams = {}
  ): Promise<PaginatedData<ServiceDeskTeamAssignment>> {
    const { data } = await api.get<
      ApiEnvelope<PaginatedData<ServiceDeskTeamAssignment>>
    >("/service-desk-team-assignments", { params: toAssignmentQuery(params) })
    return data.data
  },

  async details(): Promise<ServiceDeskTeamsDetailsCard[]> {
    const { data } = await api.get<ApiEnvelope<ServiceDeskTeamsDetailsCard[]>>(
      "/service-desk-team-assignments/details"
    )
    return data.data
  },

  async exportAll(): Promise<{ blob: Blob; filename: string }> {
    const response = await api.get<Blob>("/service-desk-team-assignments/export", {
      responseType: "blob",
    })
    return {
      blob: response.data,
      filename: extractDownloadFilename(
        response.headers?.["content-disposition"] as string | undefined,
        `infra_escalation_matrix_${new Date().toISOString().slice(0, 10)}.xlsx`
      ),
    }
  },

  async exportCategory(
    categoryId: number
  ): Promise<{ blob: Blob; filename: string }> {
    const response = await api.get<Blob>(
      `/service-desk-team-assignments/export/${categoryId}`,
      { responseType: "blob" }
    )
    return {
      blob: response.data,
      filename: extractDownloadFilename(
        response.headers?.["content-disposition"] as string | undefined,
        `infra_escalation_${categoryId}_${new Date().toISOString().slice(0, 10)}.xlsx`
      ),
    }
  },

  async create(
    payload: ServiceDeskTeamAssignmentPayload
  ): Promise<ServiceDeskTeamAssignment[]> {
    const { data } = await api.post<ApiEnvelope<ServiceDeskTeamAssignment[]>>(
      "/service-desk-team-assignments",
      payload
    )
    return data.data
  },

  async update(
    id: number,
    payload: ServiceDeskTeamAssignmentUpdatePayload
  ): Promise<ServiceDeskTeamAssignment> {
    const { data } = await api.put<ApiEnvelope<ServiceDeskTeamAssignment>>(
      `/service-desk-team-assignments/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/service-desk-team-assignments/${id}`)
  },
}
