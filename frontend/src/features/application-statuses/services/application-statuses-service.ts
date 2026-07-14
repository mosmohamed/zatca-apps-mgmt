import { api } from "@/lib/axios"
import type { ApiEnvelope, ListQueryParams, PaginatedData } from "@/types/api"
import type {
  ApplicationStatus,
  ApplicationStatusPayload,
} from "@/features/application-statuses/types/application-status"

function toQuery(params: ListQueryParams): Record<string, string | number> {
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

  return query
}

export const applicationStatusesService = {
  async list(
    params: ListQueryParams = {}
  ): Promise<PaginatedData<ApplicationStatus>> {
    const { data } = await api.get<
      ApiEnvelope<PaginatedData<ApplicationStatus>>
    >("/application-statuses", { params: toQuery(params) })
    return data.data
  },

  async create(payload: ApplicationStatusPayload): Promise<ApplicationStatus> {
    const { data } = await api.post<ApiEnvelope<ApplicationStatus>>(
      "/application-statuses",
      payload
    )
    return data.data
  },

  async update(
    id: number,
    payload: ApplicationStatusPayload
  ): Promise<ApplicationStatus> {
    const { data } = await api.put<ApiEnvelope<ApplicationStatus>>(
      `/application-statuses/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/application-statuses/${id}`)
  },
}
