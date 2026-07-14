import { api } from "@/lib/axios"
import type { ApiEnvelope, ListQueryParams, PaginatedData } from "@/types/api"
import type { ManagedUser, UserPayload } from "@/features/users/types/user"

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

export const usersService = {
  async list(params: ListQueryParams = {}): Promise<PaginatedData<ManagedUser>> {
    const { data } = await api.get<ApiEnvelope<PaginatedData<ManagedUser>>>(
      "/users",
      { params: toQuery(params) }
    )
    return data.data
  },

  async create(payload: UserPayload): Promise<ManagedUser> {
    const { data } = await api.post<ApiEnvelope<ManagedUser>>("/users", payload)
    return data.data
  },

  async update(id: number, payload: UserPayload): Promise<ManagedUser> {
    const { data } = await api.put<ApiEnvelope<ManagedUser>>(
      `/users/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/users/${id}`)
  },
}
