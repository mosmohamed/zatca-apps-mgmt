import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  useCreateProvider,
  useUpdateProvider,
} from "@/features/authentication-settings/hooks/use-authentication-settings"
import { authenticationSettingsService } from "@/features/authentication-settings/services/authentication-settings-service"
import type {
  ClaimMap,
  IdentityProvider,
  IdentityProviderPayload,
} from "@/features/authentication-settings/types/authentication-settings"
import {
  createProviderSchema,
  type ProviderFormValues,
} from "@/features/authentication-settings/types/authentication-settings-schema"
import { getApiFieldErrors } from "@/lib/api-errors"

const claimDefaults: ClaimMap = {
  first_name: "given_name",
  last_name: "family_name",
  email: "email",
  username: "preferred_username",
  employee_id: "employee_id",
  department: "department",
  job_title: "job_title",
  profile_picture: "picture",
}

const emptyValues: ProviderFormValues = {
  name: "",
  slug: "",
  protocol: "oidc",
  is_enabled: true,
  issuer: "",
  discovery_url: "",
  authorization_endpoint: "",
  token_endpoint: "",
  userinfo_endpoint: "",
  jwks_uri: "",
  client_id: "",
  client_secret: "",
  scopes: "openid profile email",
  idp_entity_id: "",
  sso_url: "",
  slo_url: "",
  x509_certificate: "",
  sp_entity_id: "",
  acs_url: "",
  claim_map: claimDefaults,
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: IdentityProvider | null
}

export function ProviderFormDialog({ open, onOpenChange, provider }: Props) {
  const { t } = useTranslation()
  const editing = provider !== null
  const schema = useMemo(() => createProviderSchema(t, editing), [t, editing])
  const createMutation = useCreateProvider()
  const updateMutation = useUpdateProvider()
  const form = useForm<ProviderFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })
  const protocol = form.watch("protocol")
  const configuration = provider?.configuration_safe ?? provider?.configuration
  const [presetType, setPresetType] = useState("generic_oidc")
  const [tenantId, setTenantId] = useState("")
  const [auth0Domain, setAuth0Domain] = useState("")

  useEffect(() => {
    if (!open) return
    form.reset(
      provider
        ? ({
            ...emptyValues,
            name: provider.name,
            slug: provider.slug,
            protocol: provider.protocol,
            is_enabled: provider.is_enabled,
            ...configuration,
            client_secret: "",
            x509_certificate: "",
            claim_map: { ...claimDefaults, ...(configuration?.claim_map ?? {}) },
          } as ProviderFormValues)
        : emptyValues
    )
    setPresetType("generic_oidc")
    setTenantId("")
    setAuth0Domain("")
  }, [open, provider, configuration, form])

  async function applyPreset() {
    const built = await authenticationSettingsService.buildPreset({
      type: presetType,
      tenant_id: tenantId,
      domain: auth0Domain,
      client_id: form.getValues("client_id"),
      client_secret: form.getValues("client_secret"),
      discovery_url: form.getValues("discovery_url"),
    })
    const config = built.configuration as Record<string, string>
    form.setValue("protocol", built.protocol)
    if (built.protocol === "oidc") {
      form.setValue("discovery_url", String(config.discovery_url ?? ""))
      form.setValue("client_id", String(config.client_id ?? form.getValues("client_id")))
      form.setValue(
        "scopes",
        Array.isArray(config.scopes)
          ? (config.scopes as unknown as string[]).join(" ")
          : "openid profile email"
      )
      const claimMap = (config.claim_mapping ?? claimDefaults) as ClaimMap
      form.setValue("claim_map", { ...claimDefaults, ...claimMap })
    }
  }

  const busy = createMutation.isPending || updateMutation.isPending

  function fieldError(name: string): string | undefined {
    const segments = name.split(".")
    let current: unknown = form.formState.errors
    for (const segment of segments) {
      current = (current as Record<string, unknown> | undefined)?.[segment]
    }
    return (current as { message?: string } | undefined)?.message
  }

  function textField(
    name: Parameters<typeof form.register>[0],
    label: string,
    options?: { type?: string; textarea?: boolean; secretHint?: boolean }
  ) {
    const error = fieldError(name)
    return (
      <div className="space-y-2">
        <Label htmlFor={`provider-${name}`}>{label}</Label>
        {options?.textarea ? (
          <Textarea
            id={`provider-${name}`}
            rows={5}
            dir="ltr"
            {...form.register(name)}
          />
        ) : (
          <Input
            id={`provider-${name}`}
            type={options?.type}
            dir="ltr"
            autoComplete={options?.type === "password" ? "new-password" : "off"}
            {...form.register(name)}
          />
        )}
        {options?.secretHint && editing ? (
          <p className="text-xs text-muted-foreground">
            {t("authentication.providers.secretPreserve")}
          </p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    )
  }

  async function submit(values: ProviderFormValues) {
    const configurationPayload =
      values.protocol === "oidc"
        ? {
            issuer: values.issuer,
            discovery_url: values.discovery_url,
            authorization_endpoint: values.authorization_endpoint,
            token_endpoint: values.token_endpoint,
            userinfo_endpoint: values.userinfo_endpoint,
            jwks_uri: values.jwks_uri,
            client_id: values.client_id,
            ...(values.client_secret ? { client_secret: values.client_secret } : {}),
            scopes: values.scopes,
            claim_map: values.claim_map,
          }
        : {
            idp_entity_id: values.idp_entity_id,
            sso_url: values.sso_url,
            slo_url: values.slo_url,
            ...(values.x509_certificate
              ? { x509_certificate: values.x509_certificate }
              : {}),
            sp_entity_id: values.sp_entity_id,
            acs_url: values.acs_url,
            claim_map: values.claim_map,
          }
    const payload: IdentityProviderPayload = {
      name: values.name,
      slug: values.slug,
      protocol: values.protocol,
      is_enabled: values.is_enabled,
      configuration: configurationPayload,
    }
    try {
      if (provider) {
        await updateMutation.mutateAsync({ id: provider.id, payload })
      } else {
        await createMutation.mutateAsync({ payload })
      }
      onOpenChange(false)
    } catch (error) {
      const errors = getApiFieldErrors(error)
      Object.entries(errors ?? {}).forEach(([name, messages]) => {
        const normalized = name.replace(/^configuration\./, "")
        form.setError(normalized as Parameters<typeof form.setError>[0], { message: messages[0] })
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {t(editing ? "authentication.providers.edit" : "authentication.providers.create")}
          </DialogTitle>
          <DialogDescription>
            {t("authentication.providers.formDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
          {!editing ? (
            <div className="space-y-3 rounded-lg border p-4">
              <Label>{t("authentication.providers.presetType")}</Label>
              <Select value={presetType} onValueChange={setPresetType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="microsoft_entra">Microsoft Entra ID</SelectItem>
                  <SelectItem value="auth0">Auth0</SelectItem>
                  <SelectItem value="keycloak">Keycloak</SelectItem>
                  <SelectItem value="okta">Okta</SelectItem>
                  <SelectItem value="generic_oidc">Generic OIDC</SelectItem>
                  <SelectItem value="generic_saml">Generic SAML</SelectItem>
                </SelectContent>
              </Select>
              {presetType === "microsoft_entra" ? (
                <div className="space-y-2">
                  <Label htmlFor="tenant-id">{t("authentication.providers.tenantId")}</Label>
                  <Input id="tenant-id" dir="ltr" value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
                </div>
              ) : null}
              {presetType === "auth0" ? (
                <div className="space-y-2">
                  <Label htmlFor="auth0-domain">{t("authentication.providers.auth0Domain")}</Label>
                  <Input id="auth0-domain" dir="ltr" value={auth0Domain} onChange={(e) => setAuth0Domain(e.target.value)} />
                </div>
              ) : null}
              <Button type="button" variant="secondary" onClick={() => void applyPreset()}>
                {t("authentication.providers.applyPreset")}
              </Button>
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            {textField("name", t("authentication.fields.name"))}
            {textField("slug", t("authentication.fields.slug"))}
            <div className="space-y-2">
              <Label>{t("authentication.fields.protocol")}</Label>
              <Controller
                control={form.control}
                name="protocol"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={editing}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oidc">OpenID Connect (OIDC)</SelectItem>
                      <SelectItem value="saml">SAML 2.0</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <Controller
              control={form.control}
              name="is_enabled"
              render={({ field }) => (
                <label className="flex items-center gap-3 self-end rounded-lg border p-3">
                  <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                  <span className="text-sm font-medium">{t("authentication.fields.enabled")}</span>
                </label>
              )}
            />
          </div>

          <div className="rounded-lg border p-4">
            <h4 className="mb-1 font-medium">
              {t(`authentication.providers.${protocol}.title`)}
            </h4>
            <p className="mb-4 text-sm text-muted-foreground">
              {t(`authentication.providers.${protocol}.description`)}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {protocol === "oidc" ? (
                <>
                  {textField("issuer", t("authentication.fields.issuer"))}
                  {textField("discovery_url", t("authentication.fields.discoveryUrl"))}
                  {textField("authorization_endpoint", t("authentication.fields.authorizationEndpoint"))}
                  {textField("token_endpoint", t("authentication.fields.tokenEndpoint"))}
                  {textField("userinfo_endpoint", t("authentication.fields.userinfoEndpoint"))}
                  {textField("jwks_uri", t("authentication.fields.jwksUri"))}
                  {textField("client_id", t("authentication.fields.clientId"))}
                  {textField("client_secret", t("authentication.fields.clientSecret"), {
                    type: "password",
                    secretHint: true,
                  })}
                  {textField("scopes", t("authentication.fields.scopes"))}
                </>
              ) : (
                <>
                  {textField("idp_entity_id", t("authentication.fields.idpEntityId"))}
                  {textField("sso_url", t("authentication.fields.ssoUrl"))}
                  {textField("slo_url", t("authentication.fields.sloUrl"))}
                  {textField("sp_entity_id", t("authentication.fields.spEntityId"))}
                  {textField("acs_url", t("authentication.fields.acsUrl"))}
                  <div className="sm:col-span-2">
                    {textField("x509_certificate", t("authentication.fields.certificate"), {
                      textarea: true,
                      secretHint: true,
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h4 className="mb-1 font-medium">{t("authentication.providers.claimMap")}</h4>
            <p className="mb-4 text-sm text-muted-foreground">
              {t("authentication.providers.claimMapDescription")}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {(Object.keys(claimDefaults) as Array<keyof ClaimMap>).map((key) =>
                textField(`claim_map.${key}`, t(`authentication.syncFields.${key}`))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? t("settings.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
