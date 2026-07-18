import type { TFunction } from "i18next"
import { z } from "zod"

const optionalUrl = (message: string) =>
  z.string().trim().refine((value) => !value || z.url().safeParse(value).success, message)

const claimMapSchema = z.object({
  first_name: z.string().trim(),
  last_name: z.string().trim(),
  email: z.string().trim(),
  username: z.string().trim(),
  employee_id: z.string().trim(),
  department: z.string().trim(),
  job_title: z.string().trim(),
  profile_picture: z.string().trim(),
})

export function createProviderSchema(t: TFunction, editing: boolean) {
  const required = t("authentication.validation.required")
  const urlMessage = t("validation.urlInvalid")
  const base = {
    name: z.string().trim().min(1, required).max(255),
    slug: z.string().trim().min(1, required).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t("authentication.validation.slug")),
    is_enabled: z.boolean(),
    claim_map: claimMapSchema,
  }

  return z.discriminatedUnion("protocol", [
    z.object({
      ...base,
      protocol: z.literal("oidc"),
      issuer: z.url(urlMessage),
      discovery_url: optionalUrl(urlMessage),
      authorization_endpoint: optionalUrl(urlMessage),
      token_endpoint: optionalUrl(urlMessage),
      userinfo_endpoint: optionalUrl(urlMessage),
      jwks_uri: optionalUrl(urlMessage),
      client_id: z.string().trim().min(1, required),
      client_secret: editing ? z.string() : z.string().min(1, required),
      scopes: z.string().trim().min(1, required),
      idp_entity_id: z.string(),
      sso_url: z.string(),
      slo_url: z.string(),
      x509_certificate: z.string(),
      sp_entity_id: z.string(),
      acs_url: z.string(),
    }),
    z.object({
      ...base,
      protocol: z.literal("saml"),
      idp_entity_id: z.string().trim().min(1, required),
      sso_url: z.url(urlMessage),
      slo_url: optionalUrl(urlMessage),
      x509_certificate: editing ? z.string() : z.string().trim().min(1, required),
      sp_entity_id: z.string().trim().min(1, required),
      acs_url: z.url(urlMessage),
      issuer: z.string(),
      discovery_url: z.string(),
      authorization_endpoint: z.string(),
      token_endpoint: z.string(),
      userinfo_endpoint: z.string(),
      jwks_uri: z.string(),
      client_id: z.string(),
      client_secret: z.string(),
      scopes: z.string(),
    }),
  ])
}

export type ProviderFormValues = z.infer<ReturnType<typeof createProviderSchema>>

export function createRoleMappingSchema(t: TFunction) {
  const required = t("authentication.validation.required")
  return z.object({
    identity_provider_id: z.number().int().positive(required),
    claim_name: z.string().trim().min(1, required).max(255),
    external_value: z.string().trim().min(1, required).max(255),
    role_id: z.number().int().positive(required),
    priority: z.number().int().min(-2147483648).max(2147483647),
    is_enabled: z.boolean(),
  })
}

export type RoleMappingFormValues = z.infer<
  ReturnType<typeof createRoleMappingSchema>
>
