import { api } from "@/lib/axios"
import type { ApiEnvelope, PaginatedData } from "@/types/api"
import type {
  Assignment,
  AssignmentListParams,
  AssignmentMatrixApplication,
  AssignmentPayload,
  AssignmentStatistics,
  AssignmentSummary,
  AssignmentSummaryParams,
  AssignmentUpdatePayload,
  BulkAssignmentPayload,
} from "@/features/assignments/types/assignment"

function toQuery(
  params: AssignmentListParams | AssignmentSummaryParams
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

  if ("application_id" in params && params.application_id) {
    query.application_id = params.application_id
  }

  if ("user_id" in params && params.user_id) {
    query.user_id = params.user_id
  }

  if ("open_only" in params && params.open_only) {
    query.open_only = true
  }

  return query
}

export const assignmentsService = {
  async list(
    params: AssignmentListParams = {}
  ): Promise<PaginatedData<Assignment>> {
    const { data } = await api.get<ApiEnvelope<PaginatedData<Assignment>>>(
      "/assignments",
      { params: toQuery(params) }
    )
    return data.data
  },

  async applicationsSummary(
    params: AssignmentSummaryParams = {}
  ): Promise<PaginatedData<AssignmentSummary>> {
    const { data } = await api.get<
      ApiEnvelope<PaginatedData<AssignmentSummary>>
    >("/assignments/applications-summary", {
      params: toQuery(params),
    })
    return data.data
  },

  async applicationMatrix(
    applicationId: number
  ): Promise<AssignmentMatrixApplication> {
    const { data } = await api.get<ApiEnvelope<AssignmentMatrixApplication>>(
      `/assignments/application/${applicationId}`
    )
    return data.data
  },

  async create(payload: AssignmentPayload): Promise<Assignment> {
    const { data } = await api.post<ApiEnvelope<Assignment>>(
      "/assignments",
      payload
    )
    return data.data
  },

  async bulkCreate(payload: BulkAssignmentPayload): Promise<Assignment[]> {
    const { data } = await api.post<ApiEnvelope<Assignment[]>>(
      "/assignments/bulk",
      payload
    )
    return data.data
  },

  async update(
    id: number,
    payload: AssignmentUpdatePayload
  ): Promise<Assignment> {
    const { data } = await api.put<ApiEnvelope<Assignment>>(
      `/assignments/${id}`,
      payload
    )
    return data.data
  },

  async end(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/assignments/${id}`)
  },

  async statistics(): Promise<AssignmentStatistics> {
    const { data } = await api.get<ApiEnvelope<AssignmentStatistics>>(
      "/assignments/statistics"
    )
    return data.data
  },
}
