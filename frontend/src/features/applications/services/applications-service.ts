import { api } from "@/lib/axios"
import type { ApiEnvelope, ListQueryParams, PaginatedData } from "@/types/api"
import type {
  Application,
  ApplicationPayload,
  ApplicationStatistics,
} from "@/features/applications/types/application"

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

export const applicationsService = {
  async list(params: ListQueryParams = {}): Promise<PaginatedData<Application>> {
    const { data } = await api.get<ApiEnvelope<PaginatedData<Application>>>(
      "/applications",
      { params: toQuery(params) }
    )

    return data.data
  },

  async get(id: number): Promise<Application> {
    const { data } = await api.get<ApiEnvelope<Application>>(
      `/applications/${id}`
    )
    return data.data
  },

  async create(payload: ApplicationPayload): Promise<Application> {
    const { data } = await api.post<ApiEnvelope<Application>>(
      "/applications",
      payload
    )
    return data.data
  },

  async update(id: number, payload: ApplicationPayload): Promise<Application> {
    const { data } = await api.put<ApiEnvelope<Application>>(
      `/applications/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/applications/${id}`)
  },

  async statistics(): Promise<ApplicationStatistics> {
    const { data } = await api.get<ApiEnvelope<ApplicationStatistics>>(
      "/applications/statistics"
    )
    return data.data
  },
}
