import { api } from "@/lib/axios"
import type { ApiEnvelope } from "@/types/api"
import type {
  Permission,
  Role,
  RolePayload,
  SyncRolePermissionsPayload,
} from "@/features/roles/types/role"

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
}
