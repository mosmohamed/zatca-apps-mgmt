import { api } from "@/lib/axios"
import type {
  ApiEnvelope,
  AuthUser,
  LoginPayload,
  LoginResponse,
} from "@/features/auth/types/auth"
import type { FederatedLogoutResult } from "@/features/account/types/account"

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await api.post<ApiEnvelope<LoginResponse>>(
      "/auth/login",
      payload
    )

    return data.data
  },

  async exchangeSsoCode(code: string): Promise<LoginResponse> {
    const { data } = await api.post<ApiEnvelope<LoginResponse>>(
      "/auth/sso/exchange",
      { code }
    )
    return data.data
  },

  async me(): Promise<AuthUser> {
    const { data } = await api.get<ApiEnvelope<AuthUser>>("/auth/me")
    return data.data
  },

  async logout(): Promise<FederatedLogoutResult> {
    const { data } = await api.post<ApiEnvelope<FederatedLogoutResult>>("/auth/logout")
    return data.data
  },
}
