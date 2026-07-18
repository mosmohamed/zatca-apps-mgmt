# SSO Staging End-to-End Validation

Manual verification checklist for real identity providers. Unit/feature tests do not
replace these scenarios.

Prerequisites:

- Application reachable with HTTPS in staging
- `APP_URL` and `FRONTEND_URL` configured
- `authentication_mode` set to `hybrid` or `sso`
- Auto-provisioning and role sync enabled for first-login tests
- Email account linking remains **disabled** unless testing the explicit link UI

Callback URLs to register at every IdP:

- OIDC: `{APP_URL}/api/v1/auth/sso/oidc/callback`
- SAML ACS: `{APP_URL}/api/v1/auth/sso/saml/acs`
- SAML SLS (optional): `{APP_URL}/api/v1/auth/sso/saml/sls`

---

## Auth0 E2E scenario

### 1. Create Auth0 application

Create a Regular Web Application.

Allowed Callback URL:

```text
https://{api-host}/api/v1/auth/sso/oidc/callback
```

Allowed Logout URL:

```text
https://{frontend-host}/login
```

### 2. Create provider in the application

Use the **Auth0** preset:

- Domain: `your-tenant.us.auth0.com`
- Client ID / Client Secret from Auth0

Confirm discovery URL:

```text
https://your-tenant.us.auth0.com/.well-known/openid-configuration
```

Run **Test Connection**.

### 3. Create Auth0 user

| Field | Value |
|-------|-------|
| Email | `john@example.com` |
| given_name | John |
| family_name | Smith |

### 4. Emit roles claim

Add a Post Login Action that sets:

```text
https://company.com/roles = ["Portfolio Administrator"]
```

### 5. Role mapping

Create a mapping rule:

| Field | Value |
|-------|-------|
| Provider | Auth0 |
| Claim name | `https://company.com/roles` |
| External value | `Portfolio Administrator` |
| Internal role | `Administrator` |

### 6. Execute login

1. Open the application login page.
2. Choose Auth0 SSO.
3. Sign in as `john@example.com`.
4. Complete the frontend exchange callback.

### 7. Expected results

- User **John Smith** exists
- `authentication_type` = `sso`
- `external_identities` row for Auth0 with OIDC `sub` in `external_subject`
- Activity log events:
  - `user-provisioned` (first login)
  - `roles-synchronized` (when roles change/assigned)
  - `sso-login-succeeded`

---

## Microsoft Entra ID E2E scenario

### 1. App registration

Register a Web application. Add redirect URI:

```text
https://{api-host}/api/v1/auth/sso/oidc/callback
```

Create a client secret (copy the **value**).

### 2. Application roles (preferred over groups)

Define app role:

```text
Portfolio.Admin
```

Assign the role to the test user. Prefer the `roles` claim (avoids group overage).

### 3. Create provider

Use the **Microsoft Entra ID** preset:

- Tenant ID
- Client ID
- Client Secret

Confirm discovery URL:

```text
https://login.microsoftonline.com/{tenant-id}/v2.0/.well-known/openid-configuration
```

Default claim mapping uses `preferred_username` for email. Run **Test Connection**.

### 4. Role mapping

| Field | Value |
|-------|-------|
| Claim name | `roles` |
| External value | `Portfolio.Admin` |
| Internal role | `Administrator` |

### 5. Expected results

- User provisioned from Entra profile claims
- `external_identities` row created
- Role `Administrator` assigned
- Audit events: `user-provisioned`, `roles-synchronized`, `sso-login-succeeded`

---

## Explicit account linking E2E

1. Keep a local user (`authentication_type=local`) signed in.
2. Enable **Allow email-based account linking** in Authentication settings
   (this gates the explicit linking feature; blind SSO email linking remains disabled).
3. Open **Account → Security**.
4. Choose **Link External Identity** and pick a provider.
5. Complete IdP authentication.
6. Confirm the preview (provider, external subject, email).
7. Expect `authentication_type=both`, `external_identities` row, and `account-linked`
   audit with `external_subject`, `ip_address`, and `user_agent`.

---

## Federated logout E2E

1. Sign in through OIDC (Auth0/Entra) where discovery exposes `end_session_endpoint`.
2. Sign out from the application.
3. Confirm browser redirects to IdP logout with `post_logout_redirect_uri` back to `/login`.
4. If the IdP has no end-session/SLO endpoint, confirm local logout still succeeds
   (`federated_logout_url` is null).
