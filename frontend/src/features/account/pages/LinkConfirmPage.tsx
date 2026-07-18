import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useConfirmIdentityLink } from "@/features/account/hooks/use-account"
import { accountService } from "@/features/account/services/account-service"
import type { IdentityLinkPreview } from "@/features/account/types/account"
import { useAuth } from "@/features/auth/hooks/use-auth"

export function LinkConfirmPage() {
  const { t } = useTranslation()
  const { refreshUser } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const code = params.get("code") ?? ""
  const confirm = useConfirmIdentityLink()
  const [preview, setPreview] = useState<IdentityLinkPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!code) {
      setError(t("account.invalidLinkCode"))
      setLoading(false)
      return
    }
    void accountService
      .previewLink(code)
      .then((data) => {
        if (!cancelled) setPreview(data)
      })
      .catch(() => {
        if (!cancelled) setError(t("account.invalidLinkCode"))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [code, t])

  async function onConfirm() {
    await confirm.mutateAsync(code)
    await refreshUser()
    navigate("/account/security", { replace: true })
  }

  if (loading) {
    return <p className="p-8 text-sm text-muted-foreground">{t("common.loading")}</p>
  }

  if (error || !preview) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-8">
        <p className="text-sm text-destructive">{error ?? t("account.invalidLinkCode")}</p>
        <Button asChild>
          <Link to="/account/security">{t("account.securityTitle")}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">{t("account.confirmLinkTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("account.confirmLinkDescription")}</p>
      </div>
      <Card>
        <CardContent className="space-y-2 pt-6 text-sm">
          <p>
            <span className="font-medium">{t("authentication.fields.provider")}: </span>
            {preview.provider.name}
          </p>
          <p dir="ltr">
            <span className="font-medium">{t("authentication.fields.externalSubject")}: </span>
            {preview.external_subject}
          </p>
          {preview.external_email ? (
            <p dir="ltr">
              <span className="font-medium">{t("auth.email")}: </span>
              {preview.external_email}
            </p>
          ) : null}
          {preview.will_become_both ? (
            <p className="text-muted-foreground">{t("account.willBecomeBoth")}</p>
          ) : null}
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button type="button" disabled={confirm.isPending} onClick={() => void onConfirm()}>
          {t("account.confirmLink")}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link to="/account/security">{t("common.cancel")}</Link>
        </Button>
      </div>
    </div>
  )
}
