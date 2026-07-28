import { api } from "@/lib/axios"
import type { ApiEnvelope, ListQueryParams, PaginatedData } from "@/types/api"
import type {
  Technology,
  TechnologyPayload,
  TechnologyStatistics,
} from "@/features/technologies/types/technology"

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

export const technologiesService = {
  async list(
    params: ListQueryParams = {}
  ): Promise<PaginatedData<Technology>> {
    const { data } = await api.get<ApiEnvelope<PaginatedData<Technology>>>(
      "/technologies",
      { params: toQuery(params) }
    )
    return data.data
  },

  async create(payload: TechnologyPayload): Promise<Technology> {
    const { data } = await api.post<ApiEnvelope<Technology>>(
      "/technologies",
      payload
    )
    return data.data
  },

  async update(id: number, payload: TechnologyPayload): Promise<Technology> {
    const { data } = await api.put<ApiEnvelope<Technology>>(
      `/technologies/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/technologies/${id}`)
  },

  async statistics(): Promise<TechnologyStatistics> {
    const { data } = await api.get<ApiEnvelope<TechnologyStatistics>>(
      "/technologies/statistics"
    )
    return data.data
  },
}
