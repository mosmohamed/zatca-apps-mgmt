import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useInitiateIdentityLink,
  useLinkedIdentities,
} from "@/features/account/hooks/use-account"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { usePublicIdentityProviders } from "@/features/authentication-settings/hooks/use-authentication-settings"
import { useSettings } from "@/features/settings/hooks/use-settings"

export function AccountSecurityPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { settings } = useSettings()
  const linksQuery = useLinkedIdentities()
  const providersQuery = usePublicIdentityProviders()
  const initiate = useInitiateIdentityLink()
  const [pickerOpen, setPickerOpen] = useState(false)

  const linkingEnabled = settings.authentication_role_mapping.allow_email_account_linking
  const linkedSlugs = useMemo(
    () =>
      new Set(
        (linksQuery.data ?? [])
          .map((row) => row.identity_provider?.slug)
          .filter((slug): slug is string => Boolean(slug))
      ),
    [linksQuery.data]
  )

  async function startLink(slug: string) {
    const result = await initiate.mutateAsync(slug)
    window.location.assign(result.redirect_url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("account.securityTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("account.securityDescription")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("account.authenticationType")}</CardTitle>
          <CardDescription>{t("account.authenticationTypeHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="outline">{user?.authentication_type ?? "local"}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{t("account.linkedIdentities")}</CardTitle>
            <CardDescription>{t("account.linkedIdentitiesHint")}</CardDescription>
          </div>
          <Button
            type="button"
            disabled={!linkingEnabled || initiate.isPending}
            onClick={() => setPickerOpen(true)}
          >
            {t("account.linkExternalIdentity")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {!linkingEnabled ? (
            <p className="text-sm text-muted-foreground">{t("account.linkingDisabled")}</p>
          ) : null}
          {(linksQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("account.noLinkedIdentities")}</p>
          ) : (
            (linksQuery.data ?? []).map((identity) => (
              <div key={identity.id} className="rounded-lg border p-3">
                <div className="font-medium">
                  {identity.identity_provider?.name ?? t("account.unknownProvider")}
                </div>
                <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
                  {t("authentication.fields.externalSubject")}: {identity.external_subject}
                </p>
                {identity.external_email ? (
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {identity.external_email}
                  </p>
                ) : null}
              </div>
            ))
          )}
          <Button type="button" variant="link" className="px-0" asChild>
            <Link to="/">{t("common.back")}</Link>
          </Button>
        </CardContent>
      </Card>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("account.linkExternalIdentity")}</DialogTitle>
            <DialogDescription>{t("account.chooseProvider")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {(providersQuery.data ?? [])
              .filter((provider) => !linkedSlugs.has(provider.slug))
              .map((provider) => (
                <Button
                  key={provider.slug}
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  disabled={initiate.isPending}
                  onClick={() => void startLink(provider.slug)}
                >
                  {provider.name}
                  <span className="ms-auto text-xs uppercase text-muted-foreground">
                    {provider.protocol}
                  </span>
                </Button>
              ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setPickerOpen(false)}>
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
