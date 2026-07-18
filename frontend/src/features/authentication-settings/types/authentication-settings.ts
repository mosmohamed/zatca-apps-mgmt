import type { Role } from "@/features/roles/types/role"

export type IdentityProtocol = "oidc" | "saml"

export type PublicIdentityProvider = {
  id: number
  name: string
  slug: string
  protocol: IdentityProtocol
}

export type ClaimMap = {
  first_name: string
  last_name: string
  email: string
  username: string
  employee_id: string
  department: string
  job_title: string
  profile_picture: string
}

export type OidcConfiguration = {
  issuer: string
  discovery_url: string
  authorization_endpoint: string
  token_endpoint: string
  userinfo_endpoint: string
  jwks_uri: string
  client_id: string
  client_secret?: string
  scopes: string
  claim_map: ClaimMap
}

export type SamlConfiguration = {
  idp_entity_id: string
  sso_url: string
  slo_url: string
  x509_certificate?: string
  sp_entity_id: string
  acs_url: string
  claim_map: ClaimMap
}

export type IdentityProvider = PublicIdentityProvider & {
  is_enabled: boolean
  configuration_safe?: Partial<OidcConfiguration & SamlConfiguration>
  configuration?: Partial<OidcConfiguration & SamlConfiguration>
  last_successful_auth_at: string | null
  created_at: string | null
  updated_at: string | null
}

export type IdentityProviderPayload = {
  name: string
  slug: string
  protocol: IdentityProtocol
  is_enabled: boolean
  configuration: OidcConfiguration | SamlConfiguration
}

export type ProviderConnectionCheck = {
  name: string
  status: "success" | "warning" | "error" | string
  message: string
}

export type ProviderConnectionTest = {
  success: boolean
  protocol: IdentityProtocol
  checks: ProviderConnectionCheck[]
  message: string
}

export type RoleMapping = {
  id: number
  identity_provider_id: number
  claim_name: string
  external_value: string
  role_id: number
  priority: number
  is_enabled: boolean
  provider?: PublicIdentityProvider
  identity_provider?: PublicIdentityProvider
  role?: Pick<Role, "id" | "name">
  role_name?: string
  created_at?: string | null
  updated_at?: string | null
}

export type RoleMappingPayload = Pick<
  RoleMapping,
  | "identity_provider_id"
  | "claim_name"
  | "external_value"
  | "role_id"
  | "priority"
  | "is_enabled"
>

export const SYNC_FIELD_KEYS = [
  "first_name",
  "last_name",
  "email",
  "username",
  "employee_id",
  "department",
  "job_title",
  "profile_picture",
] as const

export type SyncFieldKey = (typeof SYNC_FIELD_KEYS)[number]

export type AuthenticationRoleMappingSettings = {
  enabled: boolean
  auto_provisioning: boolean
  allow_email_account_linking: boolean
  require_verified_email_for_linking: boolean
  automatic_department_mapping: boolean
  department_claim: string
  default_role_id: number | null
  default_user_status: "active" | "inactive"
  update_roles_on_login: boolean
  update_user_information_on_login: boolean
  multi_match_strategy: "multiple" | "highest_priority"
  sync_fields: Record<SyncFieldKey, boolean>
}
