import { api } from "@/lib/axios"
import type { ApiEnvelope, ListQueryParams, PaginatedData } from "@/types/api"
import type {
  AppRole,
  AppRolePayload,
} from "@/features/app-roles/types/app-role"

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

export const appRolesService = {
  async list(params: ListQueryParams = {}): Promise<PaginatedData<AppRole>> {
    const { data } = await api.get<ApiEnvelope<PaginatedData<AppRole>>>(
      "/app-roles",
      { params: toQuery(params) }
    )
    return data.data
  },

  async create(payload: AppRolePayload): Promise<AppRole> {
    const { data } = await api.post<ApiEnvelope<AppRole>>(
      "/app-roles",
      payload
    )
    return data.data
  },

  async update(id: number, payload: AppRolePayload): Promise<AppRole> {
    const { data } = await api.put<ApiEnvelope<AppRole>>(
      `/app-roles/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/app-roles/${id}`)
  },
}
