import { api } from "@/lib/axios"
import type {
  SmartFacilitiesCategory,
  SmartFacilitiesCategoryListParams,
  SmartFacilitiesCategoryPayload,
  SmartFacilitiesCategoryStatistics,
  SmartFacilitiesLevel,
  SmartFacilitiesLevelListParams,
  SmartFacilitiesLevelPayload,
  SmartFacilitiesTeamAssignment,
  SmartFacilitiesTeamAssignmentListParams,
  SmartFacilitiesTeamAssignmentPayload,
  SmartFacilitiesTeamAssignmentStatistics,
  SmartFacilitiesTeamAssignmentUpdatePayload,
  SmartFacilitiesTeamsDetailsCard,
  SmartFacilitiesCategoryAssignmentMatrix,
  SmartFacilitiesCategoryAssignmentSummary,
} from "@/features/smart-facilities/types/smart-facilities"
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
  params: SmartFacilitiesLevelListParams
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
  params: SmartFacilitiesCategoryListParams
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
  params: SmartFacilitiesTeamAssignmentListParams
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
  if (params.smart_facilities_category_id) {
    query.smart_facilities_category_id = params.smart_facilities_category_id
  }
  if (params.smart_facilities_level_id) {
    query.smart_facilities_level_id = params.smart_facilities_level_id
  }
  if (params.user_id) {
    query.user_id = params.user_id
  }

  return query
}

export const smartFacilitiesLevelsService = {
  async list(
    params: SmartFacilitiesLevelListParams = {}
  ): Promise<PaginatedData<SmartFacilitiesLevel>> {
    const { data } = await api.get<ApiEnvelope<PaginatedData<SmartFacilitiesLevel>>>(
      "/smart-facilities-levels",
      { params: toLevelQuery(params) }
    )
    return data.data
  },

  async create(payload: SmartFacilitiesLevelPayload): Promise<SmartFacilitiesLevel> {
    const { data } = await api.post<ApiEnvelope<SmartFacilitiesLevel>>(
      "/smart-facilities-levels",
      payload
    )
    return data.data
  },

  async update(id: number, payload: SmartFacilitiesLevelPayload): Promise<SmartFacilitiesLevel> {
    const { data } = await api.put<ApiEnvelope<SmartFacilitiesLevel>>(
      `/smart-facilities-levels/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/smart-facilities-levels/${id}`)
  },
}

export const smartFacilitiesCategoriesService = {
  async statistics(): Promise<SmartFacilitiesCategoryStatistics> {
    const { data } = await api.get<ApiEnvelope<SmartFacilitiesCategoryStatistics>>(
      "/smart-facilities-categories/statistics"
    )
    return data.data
  },

  async list(
    params: SmartFacilitiesCategoryListParams = {}
  ): Promise<PaginatedData<SmartFacilitiesCategory>> {
    const { data } = await api.get<ApiEnvelope<PaginatedData<SmartFacilitiesCategory>>>(
      "/smart-facilities-categories",
      { params: toCategoryQuery(params) }
    )
    return data.data
  },

  async tree(activeOnly = false): Promise<SmartFacilitiesCategory[]> {
    const { data } = await api.get<ApiEnvelope<SmartFacilitiesCategory[]>>(
      "/smart-facilities-categories/tree",
      { params: activeOnly ? { active_only: true } : undefined }
    )
    return data.data
  },

  async create(payload: SmartFacilitiesCategoryPayload): Promise<SmartFacilitiesCategory> {
    const { data } = await api.post<ApiEnvelope<SmartFacilitiesCategory>>(
      "/smart-facilities-categories",
      payload
    )
    return data.data
  },

  async update(
    id: number,
    payload: SmartFacilitiesCategoryPayload
  ): Promise<SmartFacilitiesCategory> {
    const { data } = await api.put<ApiEnvelope<SmartFacilitiesCategory>>(
      `/smart-facilities-categories/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/smart-facilities-categories/${id}`)
  },
}

export const smartFacilitiesTeamAssignmentsService = {
  async statistics(): Promise<SmartFacilitiesTeamAssignmentStatistics> {
    const { data } = await api.get<ApiEnvelope<SmartFacilitiesTeamAssignmentStatistics>>(
      "/smart-facilities-team-assignments/statistics"
    )
    return data.data
  },

  async categoriesSummary(
    params: ListQueryParams = {}
  ): Promise<PaginatedData<SmartFacilitiesCategoryAssignmentSummary>> {
    const query: Record<string, string | number> = {
      page: params.page ?? 1,
      per_page: params.per_page ?? 15,
    }
    if (params.search?.trim()) query.search = params.search.trim()
    if (params.sort) query.sort = params.sort

    const { data } = await api.get<
      ApiEnvelope<PaginatedData<SmartFacilitiesCategoryAssignmentSummary>>
    >("/smart-facilities-team-assignments/categories-summary", { params: query })
    return data.data
  },

  async categoryMatrix(
    categoryId: number
  ): Promise<SmartFacilitiesCategoryAssignmentMatrix> {
    const { data } = await api.get<ApiEnvelope<SmartFacilitiesCategoryAssignmentMatrix>>(
      `/smart-facilities-team-assignments/category/${categoryId}`
    )
    return data.data
  },

  async list(
    params: SmartFacilitiesTeamAssignmentListParams = {}
  ): Promise<PaginatedData<SmartFacilitiesTeamAssignment>> {
    const { data } = await api.get<
      ApiEnvelope<PaginatedData<SmartFacilitiesTeamAssignment>>
    >("/smart-facilities-team-assignments", { params: toAssignmentQuery(params) })
    return data.data
  },

  async details(): Promise<SmartFacilitiesTeamsDetailsCard[]> {
    const { data } = await api.get<ApiEnvelope<SmartFacilitiesTeamsDetailsCard[]>>(
      "/smart-facilities-team-assignments/details"
    )
    return data.data
  },

  async exportAll(): Promise<{ blob: Blob; filename: string }> {
    const response = await api.get<Blob>("/smart-facilities-team-assignments/export", {
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
      `/smart-facilities-team-assignments/export/${categoryId}`,
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
    payload: SmartFacilitiesTeamAssignmentPayload
  ): Promise<SmartFacilitiesTeamAssignment[]> {
    const { data } = await api.post<ApiEnvelope<SmartFacilitiesTeamAssignment[]>>(
      "/smart-facilities-team-assignments",
      payload
    )
    return data.data
  },

  async update(
    id: number,
    payload: SmartFacilitiesTeamAssignmentUpdatePayload
  ): Promise<SmartFacilitiesTeamAssignment> {
    const { data } = await api.put<ApiEnvelope<SmartFacilitiesTeamAssignment>>(
      `/smart-facilities-team-assignments/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/smart-facilities-team-assignments/${id}`)
  },
}
