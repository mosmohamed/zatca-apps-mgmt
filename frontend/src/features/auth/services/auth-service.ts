import { api } from "@/lib/axios"
import type {
  ApiEnvelope,
  AuthUser,
  LoginPayload,
  LoginResponse,
} from "@/features/auth/types/auth"

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await api.post<ApiEnvelope<LoginResponse>>(
      "/auth/login",
      payload
    )

    return data.data
  },

  async me(): Promise<AuthUser> {
    const { data } = await api.get<ApiEnvelope<AuthUser>>("/auth/me")
    return data.data
  },

  async logout(): Promise<void> {
    await api.post<ApiEnvelope<null>>("/auth/logout")
  },
}
