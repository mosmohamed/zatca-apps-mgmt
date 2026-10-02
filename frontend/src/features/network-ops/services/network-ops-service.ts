import { api } from "@/lib/axios"
import type {
  NetworkOpsCategory,
  NetworkOpsCategoryListParams,
  NetworkOpsCategoryPayload,
  NetworkOpsCategoryStatistics,
  NetworkOpsLevel,
  NetworkOpsLevelListParams,
  NetworkOpsLevelPayload,
  NetworkOpsTeamAssignment,
  NetworkOpsTeamAssignmentListParams,
  NetworkOpsTeamAssignmentPayload,
  NetworkOpsTeamAssignmentStatistics,
  NetworkOpsTeamAssignmentUpdatePayload,
  NetworkOpsTeamsDetailsCard,
  NetworkOpsCategoryAssignmentMatrix,
  NetworkOpsCategoryAssignmentSummary,
} from "@/features/network-ops/types/network-ops"
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
  params: NetworkOpsLevelListParams
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
  params: NetworkOpsCategoryListParams
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
  params: NetworkOpsTeamAssignmentListParams
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
  if (params.network_ops_category_id) {
    query.network_ops_category_id = params.network_ops_category_id
  }
  if (params.network_ops_level_id) {
    query.network_ops_level_id = params.network_ops_level_id
  }
  if (params.user_id) {
    query.user_id = params.user_id
  }

  return query
}

export const networkOpsLevelsService = {
  async list(
    params: NetworkOpsLevelListParams = {}
  ): Promise<PaginatedData<NetworkOpsLevel>> {
    const { data } = await api.get<ApiEnvelope<PaginatedData<NetworkOpsLevel>>>(
      "/network-ops-levels",
      { params: toLevelQuery(params) }
    )
    return data.data
  },

  async create(payload: NetworkOpsLevelPayload): Promise<NetworkOpsLevel> {
    const { data } = await api.post<ApiEnvelope<NetworkOpsLevel>>(
      "/network-ops-levels",
      payload
    )
    return data.data
  },

  async update(id: number, payload: NetworkOpsLevelPayload): Promise<NetworkOpsLevel> {
    const { data } = await api.put<ApiEnvelope<NetworkOpsLevel>>(
      `/network-ops-levels/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/network-ops-levels/${id}`)
  },
}

export const networkOpsCategoriesService = {
  async statistics(): Promise<NetworkOpsCategoryStatistics> {
    const { data } = await api.get<ApiEnvelope<NetworkOpsCategoryStatistics>>(
      "/network-ops-categories/statistics"
    )
    return data.data
  },

  async list(
    params: NetworkOpsCategoryListParams = {}
  ): Promise<PaginatedData<NetworkOpsCategory>> {
    const { data } = await api.get<ApiEnvelope<PaginatedData<NetworkOpsCategory>>>(
      "/network-ops-categories",
      { params: toCategoryQuery(params) }
    )
    return data.data
  },

  async tree(activeOnly = false): Promise<NetworkOpsCategory[]> {
    const { data } = await api.get<ApiEnvelope<NetworkOpsCategory[]>>(
      "/network-ops-categories/tree",
      { params: activeOnly ? { active_only: true } : undefined }
    )
    return data.data
  },

  async create(payload: NetworkOpsCategoryPayload): Promise<NetworkOpsCategory> {
    const { data } = await api.post<ApiEnvelope<NetworkOpsCategory>>(
      "/network-ops-categories",
      payload
    )
    return data.data
  },

  async update(
    id: number,
    payload: NetworkOpsCategoryPayload
  ): Promise<NetworkOpsCategory> {
    const { data } = await api.put<ApiEnvelope<NetworkOpsCategory>>(
      `/network-ops-categories/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/network-ops-categories/${id}`)
  },
}

export const networkOpsTeamAssignmentsService = {
  async statistics(): Promise<NetworkOpsTeamAssignmentStatistics> {
    const { data } = await api.get<ApiEnvelope<NetworkOpsTeamAssignmentStatistics>>(
      "/network-ops-team-assignments/statistics"
    )
    return data.data
  },

  async categoriesSummary(
    params: ListQueryParams = {}
  ): Promise<PaginatedData<NetworkOpsCategoryAssignmentSummary>> {
    const query: Record<string, string | number> = {
      page: params.page ?? 1,
      per_page: params.per_page ?? 15,
    }
    if (params.search?.trim()) query.search = params.search.trim()
    if (params.sort) query.sort = params.sort

    const { data } = await api.get<
      ApiEnvelope<PaginatedData<NetworkOpsCategoryAssignmentSummary>>
    >("/network-ops-team-assignments/categories-summary", { params: query })
    return data.data
  },

  async categoryMatrix(
    categoryId: number
  ): Promise<NetworkOpsCategoryAssignmentMatrix> {
    const { data } = await api.get<ApiEnvelope<NetworkOpsCategoryAssignmentMatrix>>(
      `/network-ops-team-assignments/category/${categoryId}`
    )
    return data.data
  },

  async list(
    params: NetworkOpsTeamAssignmentListParams = {}
  ): Promise<PaginatedData<NetworkOpsTeamAssignment>> {
    const { data } = await api.get<
      ApiEnvelope<PaginatedData<NetworkOpsTeamAssignment>>
    >("/network-ops-team-assignments", { params: toAssignmentQuery(params) })
    return data.data
  },

  async details(): Promise<NetworkOpsTeamsDetailsCard[]> {
    const { data } = await api.get<ApiEnvelope<NetworkOpsTeamsDetailsCard[]>>(
      "/network-ops-team-assignments/details"
    )
    return data.data
  },

  async exportAll(): Promise<{ blob: Blob; filename: string }> {
    const response = await api.get<Blob>("/network-ops-team-assignments/export", {
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
      `/network-ops-team-assignments/export/${categoryId}`,
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
    payload: NetworkOpsTeamAssignmentPayload
  ): Promise<NetworkOpsTeamAssignment[]> {
    const { data } = await api.post<ApiEnvelope<NetworkOpsTeamAssignment[]>>(
      "/network-ops-team-assignments",
      payload
    )
    return data.data
  },

  async update(
    id: number,
    payload: NetworkOpsTeamAssignmentUpdatePayload
  ): Promise<NetworkOpsTeamAssignment> {
    const { data } = await api.put<ApiEnvelope<NetworkOpsTeamAssignment>>(
      `/network-ops-team-assignments/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/network-ops-team-assignments/${id}`)
  },
}
