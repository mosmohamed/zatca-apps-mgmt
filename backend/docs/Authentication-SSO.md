# Authentication and Single Sign-On

## Login controls

Two independent controls determine whether a login is accepted:

- The public `authentication_mode` setting controls methods available system-wide:
  - `local`: password login only; the provider list is empty and SSO initiation is rejected.
  - `sso`: SSO only; password login is rejected.
  - `hybrid`: password and SSO login are available.
- Each user has an `authentication_type`:
  - `local`: password login only.
  - `sso`: SSO login only.
  - `both`: password and SSO login.

Both controls must permit the requested method. Existing local users linked by a verified
external identity (when email linking is enabled) are upgraded to `both`. Accounts created
through automatic provisioning are created as `sso`.

External identities are stored in `external_identities` so one application user can hold
links to multiple providers (for example Microsoft Entra and Auth0) at the same time.

The `external_subject` column stores the immutable IdP identifier:

- OIDC: the `sub` claim
- SAML: NameID

(It is the same concept sometimes described as `external_user_id` in planning docs;
the database column remains `external_subject`.)

## Authentication audit

Local and SSO authentication events are written to the `authentication` activity log
with a consistent context: `user_id`, `provider` (IdP slug), `ip_address`,
`user_agent`, `result`, `failure_reason`, and `timestamp`. Provisioning, account
linking, and role synchronization use the same schema.

## Auth0 end-to-end scenario

| Item | Value |
|------|-------|
| Auth0 user | `john@example.com` |
| Auth0 name claims | `given_name=John`, `family_name=Smith` |
| Auth0 role claim | `https://portfolio.example.com/roles` = `Portfolio Administrator` |
| Local mapping | claim → local role `Administrator` |
| Expected user | John Smith, `authentication_type=sso`, role Administrator |

Steps:

1. Configure the Auth0 OIDC provider (discovery URL, client id/secret, callback URL).
2. Add a role-mapping rule for `Portfolio Administrator` → local `Administrator`.
3. Enable auto-provisioning and role sync on login.
4. Sign in through Auth0; complete the frontend exchange.
5. Confirm the provisioned user, assigned role, `external_identities` row, and
   authentication audit events (`sso-login-succeeded`, provisioning/role sync).

The public mode is available from `GET /api/v1/settings/public`. Administrators update it
through `PUT /api/v1/settings`:

```json
{
  "settings": {
    "authentication_mode": "hybrid"
  }
}
```

## Callback URLs

Configure these URLs at the identity provider, replacing `portfolio.example.com` with the
API host:

- OIDC redirect URI: `https://portfolio.example.com/api/v1/auth/sso/oidc/callback`
- SAML Assertion Consumer Service: `https://portfolio.example.com/api/v1/auth/sso/saml/acs`

The backend redirects the completed login to the configured
`services.external_auth.frontend_url`, ending in `/auth/sso/callback?code=...`.

## Auth0 OIDC example

Create a **Regular Web Application** in Auth0.

Allowed Callback URL:

```text
https://portfolio.example.com/api/v1/auth/sso/oidc/callback
```

Provider configuration for tenant `portfolio.us.auth0.com`:

```json
{
  "name": "Auth0",
  "slug": "auth0",
  "protocol": "oidc",
  "enabled": true,
  "configuration": {
    "discovery_url": "https://portfolio.us.auth0.com/.well-known/openid-configuration",
    "client_id": "AUTH0_APPLICATION_CLIENT_ID",
    "client_secret": "AUTH0_APPLICATION_CLIENT_SECRET",
    "scopes": ["openid", "profile", "email"],
    "claim_mapping": {
      "first_name": "given_name",
      "last_name": "family_name",
      "email": "email",
      "username": "nickname",
      "profile_picture": "picture"
    }
  }
}
```

For role mapping, add an Auth0 Post Login Action that emits roles in a namespaced claim,
for example `https://portfolio.example.com/roles`. Create role-mapping rules with:

- `claim_name`: `https://portfolio.example.com/roles`
- `external_value`: the Auth0 role name, such as `Portfolio Administrator`
- `role_id`: the corresponding local role

Auth0 custom claims must use a URI namespace. Keep `openid`, `profile`, and `email` in the
requested scopes.

## Microsoft Entra ID OIDC example

Register a Web application in Microsoft Entra ID and add this redirect URI:

```text
https://portfolio.example.com/api/v1/auth/sso/oidc/callback
```

Create a client secret and record its **value**, not its secret identifier. For tenant
`aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee`:

```json
{
  "name": "Microsoft Entra ID",
  "slug": "microsoft-entra",
  "protocol": "oidc",
  "enabled": true,
  "configuration": {
    "discovery_url": "https://login.microsoftonline.com/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/v2.0/.well-known/openid-configuration",
    "client_id": "11111111-2222-3333-4444-555555555555",
    "client_secret": "ENTRA_CLIENT_SECRET_VALUE",
    "scopes": ["openid", "profile", "email"],
    "claim_mapping": {
      "first_name": "given_name",
      "last_name": "family_name",
      "email": "preferred_username",
      "username": "preferred_username"
    }
  }
}
```

For deterministic role mapping, define Entra application roles and assign users or groups
to them. Entra emits their values in the `roles` claim. Create one local mapping rule per
application-role value:

- `claim_name`: `roles`
- `external_value`: the application-role value, such as `Portfolio.Admin`
- `role_id`: the matching local role

If group claims are used instead, map the `groups` claim to immutable group object IDs.
Large group memberships can produce an overage claim rather than a complete group list;
application roles avoid that limitation.

## Connection test

Authorized administrators can call:

```text
POST /api/v1/identity-providers/{identity_provider}/test
```

The endpoint requires Sanctum authentication and `identity-providers.update`. OIDC tests
fetch discovery metadata when configured, validate required endpoint URLs, and fetch JWKS.
SAML tests validate the X.509 certificate and SSO URL and fetch metadata when a
`metadata_url` or `discovery_url` is configured. It intentionally does not perform an
authorization-code flow or a client-secret grant.

The response contains an overall `success` flag, the protocol, individual checks, and a
localized summary message. Use the test after saving provider configuration and before
enabling SSO-only mode.
