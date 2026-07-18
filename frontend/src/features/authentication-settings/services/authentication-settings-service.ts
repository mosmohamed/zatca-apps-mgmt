import { api } from "@/lib/axios"
import type { ApiEnvelope, ListQueryParams, PaginatedData, PaginationMeta } from "@/types/api"
import type {
  IdentityProvider,
  IdentityProviderPayload,
  ProviderConnectionTest,
  PublicIdentityProvider,
  RoleMapping,
  RoleMappingPayload,
} from "@/features/authentication-settings/types/authentication-settings"

type LaravelPage<T> = {
  data?: T[]
  items?: T[]
  current_page?: number
  per_page?: number
  total?: number
  last_page?: number
  from?: number | null
  to?: number | null
  pagination?: PaginationMeta
}

type BackendProvider = Omit<IdentityProvider, "is_enabled" | "configuration"> & {
  enabled?: boolean
  is_enabled?: boolean
  configuration?: Record<string, unknown> & {
    claim_mapping?: IdentityProviderPayload["configuration"]["claim_map"]
  }
}

type BackendMapping = Omit<RoleMapping, "is_enabled" | "identity_provider"> & {
  enabled?: boolean
  is_enabled?: boolean
  identity_provider?: BackendProvider
}

function query(params: ListQueryParams) {
  return {
    page: params.page ?? 1,
    per_page: params.per_page ?? 15,
    ...(params.search?.trim() ? { search: params.search.trim() } : {}),
    ...(params.sort ? { sort: params.sort } : {}),
  }
}

function normalizePage<T>(value: LaravelPage<T> | T[]): PaginatedData<T> {
  if (Array.isArray(value)) {
    return {
      items: value,
      pagination: {
        current_page: 1,
        per_page: value.length,
        total: value.length,
        last_page: 1,
        from: value.length ? 1 : null,
        to: value.length || null,
      },
    }
  }
  const items = value.items ?? value.data ?? []
  if (value.pagination) return { items, pagination: value.pagination }
  return {
    items,
    pagination: {
      current_page: value.current_page ?? 1,
      per_page: value.per_page ?? items.length,
      total: value.total ?? items.length,
      last_page: value.last_page ?? 1,
      from: value.from ?? (items.length ? 1 : null),
      to: value.to ?? (items.length || null),
    },
  }
}

function normalizeProvider(provider: BackendProvider): IdentityProvider {
  const configuration = { ...(provider.configuration ?? {}) }
  if (configuration.claim_mapping) {
    configuration.claim_map = configuration.claim_mapping
    delete configuration.claim_mapping
  }
  return {
    ...provider,
    is_enabled: provider.enabled ?? provider.is_enabled ?? false,
    configuration: configuration as IdentityProvider["configuration"],
  }
}

function providerPayload(payload: IdentityProviderPayload) {
  const configuration = { ...payload.configuration } as Record<string, unknown>
  configuration.claim_mapping = configuration.claim_map
  delete configuration.claim_map
  return {
    name: payload.name,
    slug: payload.slug,
    protocol: payload.protocol,
    enabled: payload.is_enabled,
    configuration,
  }
}

function normalizeMapping(mapping: BackendMapping): RoleMapping {
  return {
    ...mapping,
    is_enabled: mapping.enabled ?? mapping.is_enabled ?? false,
    identity_provider: mapping.identity_provider
      ? normalizeProvider(mapping.identity_provider)
      : undefined,
  }
}

function mappingPayload(payload: RoleMappingPayload) {
  const { is_enabled, ...rest } = payload
  return { ...rest, enabled: is_enabled }
}

export const authenticationSettingsService = {
  async publicProviders(): Promise<PublicIdentityProvider[]> {
    const { data } = await api.get<ApiEnvelope<PublicIdentityProvider[]>>(
      "/auth/sso/providers"
    )
    return data.data
  },

  redirectUrl(slug: string): string {
    const base = String(api.defaults.baseURL ?? "/api/v1").replace(/\/$/, "")
    return `${base}/auth/sso/${encodeURIComponent(slug)}/redirect`
  },

  async providers(params: ListQueryParams): Promise<PaginatedData<IdentityProvider>> {
    const { data } = await api.get<ApiEnvelope<LaravelPage<BackendProvider> | BackendProvider[]>>(
      "/identity-providers",
      { params: query(params) }
    )
    const page = normalizePage(data.data)
    return { ...page, items: page.items.map(normalizeProvider) }
  },

  async createProvider(payload: IdentityProviderPayload): Promise<IdentityProvider> {
    const { data } = await api.post<ApiEnvelope<IdentityProvider>>(
      "/identity-providers",
      providerPayload(payload)
    )
    return normalizeProvider(data.data as unknown as BackendProvider)
  },

  async updateProvider(id: number, payload: IdentityProviderPayload): Promise<IdentityProvider> {
    const { data } = await api.put<ApiEnvelope<IdentityProvider>>(
      `/identity-providers/${id}`,
      providerPayload(payload)
    )
    return normalizeProvider(data.data as unknown as BackendProvider)
  },

  async deleteProvider(id: number): Promise<void> {
    await api.delete(`/identity-providers/${id}`)
  },

  async testProvider(id: number): Promise<ProviderConnectionTest> {
    const { data } = await api.post<ProviderConnectionTest>(
      `/identity-providers/${id}/test`
    )
    return data
  },

  async listPresets(): Promise<
    Array<{ type: string; label: string; protocol: string; required_fields: string[] }>
  > {
    const { data } = await api.get<
      ApiEnvelope<Array<{ type: string; label: string; protocol: string; required_fields: string[] }>>
    >("/identity-providers/presets")
    return data.data
  },

  async buildPreset(payload: Record<string, string>): Promise<{
    protocol: "oidc" | "saml"
    configuration: Record<string, unknown>
  }> {
    const { data } = await api.post<
      ApiEnvelope<{ protocol: "oidc" | "saml"; configuration: Record<string, unknown> }>
    >("/identity-providers/presets/build", payload)
    return data.data
  },

  async mappings(params: ListQueryParams): Promise<PaginatedData<RoleMapping>> {
    const { data } = await api.get<ApiEnvelope<LaravelPage<BackendMapping> | BackendMapping[]>>(
      "/role-mappings",
      { params: query(params) }
    )
    const page = normalizePage(data.data)
    return { ...page, items: page.items.map(normalizeMapping) }
  },

  async createMapping(payload: RoleMappingPayload): Promise<RoleMapping> {
    const { data } = await api.post<ApiEnvelope<BackendMapping>>("/role-mappings", mappingPayload(payload))
    return normalizeMapping(data.data)
  },

  async updateMapping(id: number, payload: RoleMappingPayload): Promise<RoleMapping> {
    const { data } = await api.put<ApiEnvelope<RoleMapping>>(
      `/role-mappings/${id}`,
      mappingPayload(payload)
    )
    return normalizeMapping(data.data as unknown as BackendMapping)
  },

  async deleteMapping(id: number): Promise<void> {
    await api.delete(`/role-mappings/${id}`)
  },
}
