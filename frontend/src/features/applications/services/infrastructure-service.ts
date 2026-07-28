import { api } from "@/lib/axios"
import type {
  ApplicationEnvironmentProfile,
  ApplicationInfrastructure,
  CopyEnvironmentPayload,
  UpsertEnvironmentPayload,
} from "@/features/applications/types/infrastructure"
import type { ApiEnvelope } from "@/types/api"

export const applicationInfrastructureService = {
  async get(applicationId: number): Promise<ApplicationInfrastructure> {
    const { data } = await api.get<ApiEnvelope<ApplicationInfrastructure>>(
      `/applications/${applicationId}/infrastructure`
    )
    return data.data
  },

  async upsertEnvironment(
    applicationId: number,
    environmentId: number,
    payload: UpsertEnvironmentPayload
  ): Promise<ApplicationEnvironmentProfile> {
    const { data } = await api.put<ApiEnvelope<ApplicationEnvironmentProfile>>(
      `/applications/${applicationId}/environments/${environmentId}`,
      payload
    )
    return data.data
  },

  async deleteEnvironment(
    applicationId: number,
    environmentId: number
  ): Promise<void> {
    await api.delete<ApiEnvelope<null>>(
      `/applications/${applicationId}/environments/${environmentId}`
    )
  },

  async copyEnvironment(
    applicationId: number,
    payload: CopyEnvironmentPayload
  ): Promise<ApplicationEnvironmentProfile> {
    const { data } = await api.post<ApiEnvelope<ApplicationEnvironmentProfile>>(
      `/applications/${applicationId}/infrastructure/copy-environment`,
      payload
    )
    return data.data
  },
}
