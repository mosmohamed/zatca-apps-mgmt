import { api } from "@/lib/axios"
import type { ApiEnvelope, ListQueryParams, PaginatedData } from "@/types/api"
import type {
  Criticality,
  CriticalityPayload,
} from "@/features/criticalities/types/criticality"

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

export const criticalitiesService = {
  async list(
    params: ListQueryParams = {}
  ): Promise<PaginatedData<Criticality>> {
    const { data } = await api.get<ApiEnvelope<PaginatedData<Criticality>>>(
      "/criticalities",
      { params: toQuery(params) }
    )
    return data.data
  },

  async create(payload: CriticalityPayload): Promise<Criticality> {
    const { data } = await api.post<ApiEnvelope<Criticality>>(
      "/criticalities",
      payload
    )
    return data.data
  },

  async update(id: number, payload: CriticalityPayload): Promise<Criticality> {
    const { data } = await api.put<ApiEnvelope<Criticality>>(
      `/criticalities/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/criticalities/${id}`)
  },
}
