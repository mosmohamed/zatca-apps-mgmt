import { api } from "@/lib/axios"
import type {
  ReleaseManagementCategory,
  ReleaseManagementCategoryListParams,
  ReleaseManagementCategoryPayload,
  ReleaseManagementCategoryStatistics,
  ReleaseManagementLevel,
  ReleaseManagementLevelListParams,
  ReleaseManagementLevelPayload,
  ReleaseManagementTeamAssignment,
  ReleaseManagementTeamAssignmentListParams,
  ReleaseManagementTeamAssignmentPayload,
  ReleaseManagementTeamAssignmentStatistics,
  ReleaseManagementTeamAssignmentUpdatePayload,
  ReleaseManagementTeamsDetailsCard,
  ReleaseManagementCategoryAssignmentMatrix,
  ReleaseManagementCategoryAssignmentSummary,
} from "@/features/release-management/types/release-management"
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
  params: ReleaseManagementLevelListParams
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
  params: ReleaseManagementCategoryListParams
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
  params: ReleaseManagementTeamAssignmentListParams
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
  if (params.release_management_category_id) {
    query.release_management_category_id = params.release_management_category_id
  }
  if (params.release_management_level_id) {
    query.release_management_level_id = params.release_management_level_id
  }
  if (params.user_id) {
    query.user_id = params.user_id
  }

  return query
}

export const releaseManagementLevelsService = {
  async list(
    params: ReleaseManagementLevelListParams = {}
  ): Promise<PaginatedData<ReleaseManagementLevel>> {
    const { data } = await api.get<ApiEnvelope<PaginatedData<ReleaseManagementLevel>>>(
      "/release-management-levels",
      { params: toLevelQuery(params) }
    )
    return data.data
  },

  async create(payload: ReleaseManagementLevelPayload): Promise<ReleaseManagementLevel> {
    const { data } = await api.post<ApiEnvelope<ReleaseManagementLevel>>(
      "/release-management-levels",
      payload
    )
    return data.data
  },

  async update(id: number, payload: ReleaseManagementLevelPayload): Promise<ReleaseManagementLevel> {
    const { data } = await api.put<ApiEnvelope<ReleaseManagementLevel>>(
      `/release-management-levels/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/release-management-levels/${id}`)
  },
}

export const releaseManagementCategoriesService = {
  async statistics(): Promise<ReleaseManagementCategoryStatistics> {
    const { data } = await api.get<ApiEnvelope<ReleaseManagementCategoryStatistics>>(
      "/release-management-categories/statistics"
    )
    return data.data
  },

  async list(
    params: ReleaseManagementCategoryListParams = {}
  ): Promise<PaginatedData<ReleaseManagementCategory>> {
    const { data } = await api.get<ApiEnvelope<PaginatedData<ReleaseManagementCategory>>>(
      "/release-management-categories",
      { params: toCategoryQuery(params) }
    )
    return data.data
  },

  async tree(activeOnly = false): Promise<ReleaseManagementCategory[]> {
    const { data } = await api.get<ApiEnvelope<ReleaseManagementCategory[]>>(
      "/release-management-categories/tree",
      { params: activeOnly ? { active_only: true } : undefined }
    )
    return data.data
  },

  async create(payload: ReleaseManagementCategoryPayload): Promise<ReleaseManagementCategory> {
    const { data } = await api.post<ApiEnvelope<ReleaseManagementCategory>>(
      "/release-management-categories",
      payload
    )
    return data.data
  },

  async update(
    id: number,
    payload: ReleaseManagementCategoryPayload
  ): Promise<ReleaseManagementCategory> {
    const { data } = await api.put<ApiEnvelope<ReleaseManagementCategory>>(
      `/release-management-categories/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/release-management-categories/${id}`)
  },
}

export const releaseManagementTeamAssignmentsService = {
  async statistics(): Promise<ReleaseManagementTeamAssignmentStatistics> {
    const { data } = await api.get<ApiEnvelope<ReleaseManagementTeamAssignmentStatistics>>(
      "/release-management-team-assignments/statistics"
    )
    return data.data
  },

  async categoriesSummary(
    params: ListQueryParams = {}
  ): Promise<PaginatedData<ReleaseManagementCategoryAssignmentSummary>> {
    const query: Record<string, string | number> = {
      page: params.page ?? 1,
      per_page: params.per_page ?? 15,
    }
    if (params.search?.trim()) query.search = params.search.trim()
    if (params.sort) query.sort = params.sort

    const { data } = await api.get<
      ApiEnvelope<PaginatedData<ReleaseManagementCategoryAssignmentSummary>>
    >("/release-management-team-assignments/categories-summary", { params: query })
    return data.data
  },

  async categoryMatrix(
    categoryId: number
  ): Promise<ReleaseManagementCategoryAssignmentMatrix> {
    const { data } = await api.get<ApiEnvelope<ReleaseManagementCategoryAssignmentMatrix>>(
      `/release-management-team-assignments/category/${categoryId}`
    )
    return data.data
  },

  async list(
    params: ReleaseManagementTeamAssignmentListParams = {}
  ): Promise<PaginatedData<ReleaseManagementTeamAssignment>> {
    const { data } = await api.get<
      ApiEnvelope<PaginatedData<ReleaseManagementTeamAssignment>>
    >("/release-management-team-assignments", { params: toAssignmentQuery(params) })
    return data.data
  },

  async details(): Promise<ReleaseManagementTeamsDetailsCard[]> {
    const { data } = await api.get<ApiEnvelope<ReleaseManagementTeamsDetailsCard[]>>(
      "/release-management-team-assignments/details"
    )
    return data.data
  },

  async exportAll(): Promise<{ blob: Blob; filename: string }> {
    const response = await api.get<Blob>("/release-management-team-assignments/export", {
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
      `/release-management-team-assignments/export/${categoryId}`,
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
    payload: ReleaseManagementTeamAssignmentPayload
  ): Promise<ReleaseManagementTeamAssignment[]> {
    const { data } = await api.post<ApiEnvelope<ReleaseManagementTeamAssignment[]>>(
      "/release-management-team-assignments",
      payload
    )
    return data.data
  },

  async update(
    id: number,
    payload: ReleaseManagementTeamAssignmentUpdatePayload
  ): Promise<ReleaseManagementTeamAssignment> {
    const { data } = await api.put<ApiEnvelope<ReleaseManagementTeamAssignment>>(
      `/release-management-team-assignments/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/release-management-team-assignments/${id}`)
  },
}
