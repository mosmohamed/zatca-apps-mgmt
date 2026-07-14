import { api } from "@/lib/axios"
import type { ApiEnvelope, ListQueryParams, PaginatedData } from "@/types/api"
import type {
  Permission,
  Role,
  RolePayload,
  SyncRolePermissionsPayload,
} from "@/features/roles/types/role"
import type { ManagedUser } from "@/features/users/types/user"

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

export const rolesService = {
  async list(): Promise<Role[]> {
    const { data } = await api.get<ApiEnvelope<Role[]>>("/roles")
    return data.data
  },

  async permissions(): Promise<Permission[]> {
    const { data } = await api.get<ApiEnvelope<Permission[]>>("/permissions")
    return data.data
  },

  async create(payload: RolePayload): Promise<Role> {
    const { data } = await api.post<ApiEnvelope<Role>>("/roles", payload)
    return data.data
  },

  async update(id: number, payload: RolePayload): Promise<Role> {
    const { data } = await api.put<ApiEnvelope<Role>>(`/roles/${id}`, payload)
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/roles/${id}`)
  },

  async syncPermissions(
    id: number,
    payload: SyncRolePermissionsPayload
  ): Promise<Role> {
    const { data } = await api.put<ApiEnvelope<Role>>(
      `/roles/${id}/permissions`,
      payload
    )
    return data.data
  },

  async listUsers(
    roleId: number,
    params: ListQueryParams = {}
  ): Promise<PaginatedData<ManagedUser>> {
    const { data } = await api.get<ApiEnvelope<PaginatedData<ManagedUser>>>(
      `/roles/${roleId}/users`,
      { params: toQuery(params) }
    )
    return data.data
  },

  async attachUser(roleId: number, userId: number): Promise<ManagedUser> {
    const { data } = await api.post<ApiEnvelope<ManagedUser>>(
      `/roles/${roleId}/users`,
      { user_id: userId }
    )
    return data.data
  },

  async detachUser(roleId: number, userId: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/roles/${roleId}/users/${userId}`)
  },
}
