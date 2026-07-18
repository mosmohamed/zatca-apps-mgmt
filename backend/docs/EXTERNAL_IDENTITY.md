# External Identity and Role Mapping

## Purpose

The external identity module provides provider-independent OIDC and SAML 2.0
authentication, automatic user provisioning, and claim-to-role mapping. Provider
configuration is encrypted at rest and secret values are never returned by API
resources or written to activity logs.

## Schema

- `identity_providers`: provider name, slug, protocol (`oidc`|`saml`), enabled state,
  encrypted protocol configuration, and `last_successful_auth_at`.
- `external_identities`: one row per `(user, identity_provider)` with
  `external_subject`, `external_email`, and `last_login_at`. This is the
  source of truth for multi-provider linking (Entra + Auth0 + Keycloak on one user).

### `external_subject`

The immutable identifier received from the Identity Provider.

- For OIDC providers this represents the `sub` claim.
- For SAML providers this represents NameID.

Do **not** treat this field as a rename of `external_user_id`. The column name
`external_subject` is intentional and protocol-neutral. Documentation that
historically said `external_user_id` refers to the same concept.

Constraints:

- Unique `(identity_provider_id, external_subject)` — one external identity cannot
  belong to multiple users.
- Unique `(user_id, identity_provider_id)` — one user can link multiple providers,
  at most once per provider.

- `role_mapping_rules`: provider claim/attribute, normalized external value,
  Spatie role, priority, and enabled state.
- `users`: denormalized `identity_provider_id` / `external_subject` for the
  last-used provider, plus `authentication_type`, `username`, `employee_id`,
  `department_id`, `profile_picture_url`, and `last_sso_login_at`.
- `settings.authentication_role_mapping`: provisioning, synchronization, default
  role/status, department mapping, multi-match behavior, and account-linking
  controls (`allow_email_account_linking` default `false`,
  `require_verified_email_for_linking` default `true`).

## Authentication audit events

All authentication audits use the `authentication` log name and a consistent
property schema:

```json
{
  "user_id": 123,
  "email": "user@example.com",
  "provider": "auth0",
  "provider_id": 1,
  "provider_protocol": "oidc",
  "ip_address": "203.0.113.10",
  "user_agent": "Mozilla/5.0 ...",
  "result": "success",
  "failure_reason": null,
  "timestamp": "2026-07-17T15:00:00+00:00"
}
```

Events include: `local-login-succeeded`, `local-login-failed`,
`sso-login-succeeded`, `sso-login-failed`, `account-linked`, `user-provisioned`,
`user-synchronized`, and `roles-synchronized`. Provisioning and role events may
also include `previous_roles`, `new_roles`, `mapping_rules`, and `external_subject`.


## Explicit account linking

SSO login matches only by `(identity_provider_id, external_subject)`.

If the IdP email already belongs to a local account, provisioning fails with a
clear message directing the user to sign in and use **Link External Identity**.

Authenticated linking flow:

1. User signs in
2. Opens Account security → Link External Identity
3. Completes IdP authentication
4. Confirms the pending identity (subject, email, provider)
5. System creates `external_identities` and upgrades `local` → `both`

`allow_email_account_linking` (default false) gates this explicit feature.
`require_verified_email_for_linking` (default true) is enforced during confirm.


## API endpoints

Public:

- `GET /api/v1/auth/sso/providers`
- `GET /api/v1/auth/sso/{provider-slug}/redirect`
- `GET /api/v1/auth/sso/oidc/callback`
- `POST /api/v1/auth/sso/saml/acs`
- `POST /api/v1/auth/sso/exchange`

Authenticated administration:

- `GET|POST /api/v1/identity-providers`
- `GET|PUT|DELETE /api/v1/identity-providers/{id}`
- `GET|POST /api/v1/role-mappings`
- `GET|PUT|DELETE /api/v1/role-mappings/{id}`

The callback redirects only to
`FRONTEND_URL/auth/sso/callback?code=...`. The short-lived code is single use and
must be submitted to the exchange endpoint to obtain a Sanctum bearer token.

## Permissions

`identity-providers.{view,create,update,delete}` and
`role-mappings.{view,create,update,delete}` are assigned to `super_admin`.
Employees receive no external identity management permissions.

## OIDC provider setup

Set `protocol` to `oidc`. Configuration accepts `issuer`,
`authorization_endpoint`, `token_endpoint`, optional `userinfo_endpoint`,
`jwks_uri`, `client_id`, `client_secret`, `scopes`, and `claim_mapping`. A
`discovery_url` may replace explicit protocol endpoints. Register
`APP_URL/api/v1/auth/sso/oidc/callback` at the provider. Authorization Code,
state, nonce, PKCE S256, JWKS signature, issuer, audience, expiry, and subject
validation are enforced.

## SAML provider setup

Set `protocol` to `saml`. Configuration requires `idp_entity_id`, `sso_url`,
`x509_certificate`, `sp_entity_id`, `acs_url`, and `claim_mapping`; `slo_url` is
optional. Configure the IdP ACS URL as
`APP_URL/api/v1/auth/sso/saml/acs`. Assertions must be signed, correlated to the
stored AuthnRequest, and pass the OneLogin strict validation profile.

## Mapping behavior

Rules read scalar, array, and nested dot-path claims. Values are trimmed and
case-normalized before exact comparison. `multiple` assigns every matched role;
`highest_priority` assigns all matches at the highest priority. The configured
default role is used only when no rule matches. Provider `claim_mapping` controls
user fields without provider-specific code.

Set `FRONTEND_URL` in every environment. Run `php artisan db:seed
--class=PermissionSeeder` after deployment so existing installations receive
the new permissions.
