import { api } from "@/lib/axios"
import type { ApiEnvelope, AuthUser } from "@/features/auth/types/auth"
import type {
  FederatedLogoutResult,
  IdentityLinkPreview,
  LinkedExternalIdentity,
} from "@/features/account/types/account"

export const accountService = {
  async listLinks(): Promise<LinkedExternalIdentity[]> {
    const { data } = await api.get<ApiEnvelope<LinkedExternalIdentity[]>>(
      "/auth/identity-links"
    )
    return data.data
  },

  async initiateLink(slug: string): Promise<{ redirect_url: string }> {
    const { data } = await api.post<ApiEnvelope<{ redirect_url: string }>>(
      `/auth/identity-links/${slug}/initiate`
    )
    return data.data
  },

  async previewLink(code: string): Promise<IdentityLinkPreview> {
    const { data } = await api.get<ApiEnvelope<IdentityLinkPreview>>(
      "/auth/identity-links/preview",
      { params: { code } }
    )
    return data.data
  },

  async confirmLink(
    code: string
  ): Promise<{ identity: LinkedExternalIdentity; user: AuthUser }> {
    const { data } = await api.post<
      ApiEnvelope<{ identity: LinkedExternalIdentity; user: AuthUser }>
    >("/auth/identity-links/confirm", { code })
    return data.data
  },
}

export type { FederatedLogoutResult }
