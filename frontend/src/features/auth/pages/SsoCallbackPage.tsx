import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router-dom"

import { AppLogo } from "@/components/AppLogo"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { getApiErrorMessage } from "@/lib/api-errors"

export function SsoCallbackPage() {
  const { t } = useTranslation()
  const { exchangeSsoCode } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const code = params.get("code")
    if (!code) {
      setError(t("auth.sso.missingCode"))
      return
    }

    window.history.replaceState({}, document.title, window.location.pathname)
    void exchangeSsoCode(code)
      .then(() => navigate("/", { replace: true }))
      .catch((reason: unknown) =>
        setError(getApiErrorMessage(reason, t("auth.sso.exchangeFailed")))
      )
  }, [exchangeSsoCode, navigate, params, t])

  return (
    <main className="flex min-h-screen items-center justify-center bg-body px-4">
      <div className="w-full max-w-md rounded-2xl border border-stroke bg-card p-8 text-center shadow-sm">
        <AppLogo className="mb-6 justify-center" imgClassName="mx-auto h-12 w-auto" />
        {error ? (
          <>
            <h1 className="text-xl font-semibold">{t("auth.sso.failedTitle")}</h1>
            <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>
            <Button type="button" className="mt-6" onClick={() => navigate("/login", { replace: true })}>
              {t("auth.sso.backToLogin")}
            </Button>
          </>
        ) : (
          <>
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
            <h1 className="mt-4 text-xl font-semibold">{t("auth.sso.completing")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("auth.sso.wait")}</p>
          </>
        )}
      </div>
    </main>
  )
}
