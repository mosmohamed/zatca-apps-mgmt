export type LinkedExternalIdentity = {
  id: number
  user_id: number
  identity_provider_id: number
  external_subject: string
  external_email: string | null
  last_login_at: string | null
  identity_provider?: {
    id: number
    name: string
    slug: string
    protocol: string
  } | null
}

export type IdentityLinkPreview = {
  provider: {
    id: number
    name: string
    slug: string
    protocol: string
  }
  external_subject: string
  external_email: string | null
  email_verified: boolean
  authentication_type: string
  will_become_both: boolean
}

export type FederatedLogoutResult = {
  federated_logout_url: string | null
  protocol: string | null
  provider: string | null
}
