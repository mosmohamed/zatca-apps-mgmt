import { api } from "@/lib/axios"
import type { ApiEnvelope, ListQueryParams, PaginatedData } from "@/types/api"
import type {
  SupportType,
  SupportTypePayload,
} from "@/features/support-types/types/support-type"

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

export const supportTypesService = {
  async list(
    params: ListQueryParams = {}
  ): Promise<PaginatedData<SupportType>> {
    const { data } = await api.get<ApiEnvelope<PaginatedData<SupportType>>>(
      "/support-types",
      { params: toQuery(params) }
    )
    return data.data
  },

  async create(payload: SupportTypePayload): Promise<SupportType> {
    const { data } = await api.post<ApiEnvelope<SupportType>>(
      "/support-types",
      payload
    )
    return data.data
  },

  async update(id: number, payload: SupportTypePayload): Promise<SupportType> {
    const { data } = await api.put<ApiEnvelope<SupportType>>(
      `/support-types/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/support-types/${id}`)
  },
}
