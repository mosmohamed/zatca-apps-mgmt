import { api } from "@/lib/axios"
import type {
  InfraCategory,
  InfraCategoryListParams,
  InfraCategoryPayload,
  InfraCategoryStatistics,
  InfraLevel,
  InfraLevelListParams,
  InfraLevelPayload,
  InfraTeamAssignment,
  InfraTeamAssignmentListParams,
  InfraTeamAssignmentPayload,
  InfraTeamAssignmentStatistics,
  InfraTeamAssignmentUpdatePayload,
  InfraTeamsDetailsCard,
  InfraCategoryAssignmentMatrix,
  InfraCategoryAssignmentSummary,
} from "@/features/operation-infra/types/operation-infra"
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
  params: InfraLevelListParams
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
  params: InfraCategoryListParams
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
  params: InfraTeamAssignmentListParams
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
  if (params.infra_category_id) {
    query.infra_category_id = params.infra_category_id
  }
  if (params.infra_level_id) {
    query.infra_level_id = params.infra_level_id
  }
  if (params.user_id) {
    query.user_id = params.user_id
  }

  return query
}

export const infraLevelsService = {
  async list(
    params: InfraLevelListParams = {}
  ): Promise<PaginatedData<InfraLevel>> {
    const { data } = await api.get<ApiEnvelope<PaginatedData<InfraLevel>>>(
      "/infra-levels",
      { params: toLevelQuery(params) }
    )
    return data.data
  },

  async create(payload: InfraLevelPayload): Promise<InfraLevel> {
    const { data } = await api.post<ApiEnvelope<InfraLevel>>(
      "/infra-levels",
      payload
    )
    return data.data
  },

  async update(id: number, payload: InfraLevelPayload): Promise<InfraLevel> {
    const { data } = await api.put<ApiEnvelope<InfraLevel>>(
      `/infra-levels/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/infra-levels/${id}`)
  },
}

export const infraCategoriesService = {
  async statistics(): Promise<InfraCategoryStatistics> {
    const { data } = await api.get<ApiEnvelope<InfraCategoryStatistics>>(
      "/infra-categories/statistics"
    )
    return data.data
  },

  async list(
    params: InfraCategoryListParams = {}
  ): Promise<PaginatedData<InfraCategory>> {
    const { data } = await api.get<ApiEnvelope<PaginatedData<InfraCategory>>>(
      "/infra-categories",
      { params: toCategoryQuery(params) }
    )
    return data.data
  },

  async tree(activeOnly = false): Promise<InfraCategory[]> {
    const { data } = await api.get<ApiEnvelope<InfraCategory[]>>(
      "/infra-categories/tree",
      { params: activeOnly ? { active_only: true } : undefined }
    )
    return data.data
  },

  async create(payload: InfraCategoryPayload): Promise<InfraCategory> {
    const { data } = await api.post<ApiEnvelope<InfraCategory>>(
      "/infra-categories",
      payload
    )
    return data.data
  },

  async update(
    id: number,
    payload: InfraCategoryPayload
  ): Promise<InfraCategory> {
    const { data } = await api.put<ApiEnvelope<InfraCategory>>(
      `/infra-categories/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/infra-categories/${id}`)
  },
}

export const infraTeamAssignmentsService = {
  async statistics(): Promise<InfraTeamAssignmentStatistics> {
    const { data } = await api.get<ApiEnvelope<InfraTeamAssignmentStatistics>>(
      "/infra-team-assignments/statistics"
    )
    return data.data
  },

  async categoriesSummary(
    params: ListQueryParams = {}
  ): Promise<PaginatedData<InfraCategoryAssignmentSummary>> {
    const query: Record<string, string | number> = {
      page: params.page ?? 1,
      per_page: params.per_page ?? 15,
    }
    if (params.search?.trim()) query.search = params.search.trim()
    if (params.sort) query.sort = params.sort

    const { data } = await api.get<
      ApiEnvelope<PaginatedData<InfraCategoryAssignmentSummary>>
    >("/infra-team-assignments/categories-summary", { params: query })
    return data.data
  },

  async categoryMatrix(
    categoryId: number
  ): Promise<InfraCategoryAssignmentMatrix> {
    const { data } = await api.get<ApiEnvelope<InfraCategoryAssignmentMatrix>>(
      `/infra-team-assignments/category/${categoryId}`
    )
    return data.data
  },

  async list(
    params: InfraTeamAssignmentListParams = {}
  ): Promise<PaginatedData<InfraTeamAssignment>> {
    const { data } = await api.get<
      ApiEnvelope<PaginatedData<InfraTeamAssignment>>
    >("/infra-team-assignments", { params: toAssignmentQuery(params) })
    return data.data
  },

  async details(): Promise<InfraTeamsDetailsCard[]> {
    const { data } = await api.get<ApiEnvelope<InfraTeamsDetailsCard[]>>(
      "/infra-team-assignments/details"
    )
    return data.data
  },

  async exportAll(): Promise<{ blob: Blob; filename: string }> {
    const response = await api.get<Blob>("/infra-team-assignments/export", {
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
      `/infra-team-assignments/export/${categoryId}`,
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
    payload: InfraTeamAssignmentPayload
  ): Promise<InfraTeamAssignment[]> {
    const { data } = await api.post<ApiEnvelope<InfraTeamAssignment[]>>(
      "/infra-team-assignments",
      payload
    )
    return data.data
  },

  async update(
    id: number,
    payload: InfraTeamAssignmentUpdatePayload
  ): Promise<InfraTeamAssignment> {
    const { data } = await api.put<ApiEnvelope<InfraTeamAssignment>>(
      `/infra-team-assignments/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/infra-team-assignments/${id}`)
  },
}
