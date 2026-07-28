import type {
  ApplicationPreview,
  DepartmentPreview,
  UserPreview,
  VendorPreview,
} from "@/features/entity-preview/types/entity-preview"
import { api } from "@/lib/axios"
import type { ApiEnvelope } from "@/types/api"

export const entityPreviewService = {
  async user(id: number): Promise<UserPreview> {
    const { data } = await api.get<ApiEnvelope<UserPreview>>(
      `/users/${id}/preview`
    )
    return data.data
  },

  async vendor(id: number): Promise<VendorPreview> {
    const { data } = await api.get<ApiEnvelope<VendorPreview>>(
      `/vendors/${id}/preview`
    )
    return data.data
  },

  async application(id: number): Promise<ApplicationPreview> {
    const { data } = await api.get<ApiEnvelope<ApplicationPreview>>(
      `/applications/${id}/preview`
    )
    return data.data
  },

  async department(id: number): Promise<DepartmentPreview> {
    const { data } = await api.get<ApiEnvelope<DepartmentPreview>>(
      `/departments/${id}/preview`
    )
    return data.data
  },

  async userByName(name: string): Promise<UserPreview | null> {
    const { data } = await api.get<ApiEnvelope<UserPreview | null>>(
      "/users/preview-by-name",
      { params: { name } }
    )
    return data.data
  },
}
