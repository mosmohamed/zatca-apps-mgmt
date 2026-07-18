import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import { z } from "zod"

import { AppLogo } from "@/components/AppLogo"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  getApiErrorMessage,
  useAuth,
} from "@/features/auth/hooks/use-auth"
import { useSettings } from "@/features/settings/hooks/use-settings"
import { usePublicIdentityProviders } from "@/features/authentication-settings/hooks/use-authentication-settings"
import { authenticationSettingsService } from "@/features/authentication-settings/services/authentication-settings-service"

type LoginFormValues = {
  email: string
  password: string
}

export function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)
  const providersQuery = usePublicIdentityProviders()
  const showLocalLogin = settings.authentication_mode !== "sso"
  const showSsoLogin = settings.authentication_mode !== "local"

  useEffect(() => {
    document.title = settings.company_name
  }, [settings.company_name])

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .min(1, t("validation.emailRequired"))
          .email(t("validation.emailInvalid")),
        password: z.string().min(1, t("validation.passwordRequired")),
      }),
    [t]
  )

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: LoginFormValues) {
    setFormError(null)

    try {
      await login(values)
      const redirectTo =
        (location.state as { from?: { pathname?: string } } | null)?.from
          ?.pathname ?? "/"
      navigate(redirectTo, { replace: true })
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const errors = error.response.data?.errors as
          | Record<string, string[]>
          | undefined

        if (errors) {
          Object.entries(errors).forEach(([field, messages]) => {
            if (field === "email" || field === "password") {
              form.setError(field, { message: messages[0] })
            }
          })
        }
      }

      setFormError(getApiErrorMessage(error, t("auth.unableToSignIn")))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-body px-4">
      <div className="absolute end-4 top-4 sm:end-6 sm:top-6">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-stroke bg-card p-8 shadow-sm">
        <div className="mb-8 space-y-3 text-center">
          <AppLogo
            className="justify-center"
            imgClassName="mx-auto h-12 w-auto max-w-[220px]"
          />
          <div className="space-y-1">
            <p className="text-sm font-semibold tracking-tight">
              {settings.company_name}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("auth.signIn")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("app.subtitle")}</p>
          </div>
        </div>

        {showLocalLogin ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.email")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="username"
                      placeholder="name@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.password")}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {formError ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? t("auth.signingIn")
                : t("auth.signIn")}
            </Button>
            </form>
          </Form>
        ) : null}
        {showSsoLogin && providersQuery.data && providersQuery.data.length > 0 ? (
          <div className={showLocalLogin ? "mt-6 space-y-3" : "space-y-3"}>
            {showLocalLogin ? <div className="flex items-center gap-3" aria-hidden="true">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{t("auth.sso.or")}</span>
              <div className="h-px flex-1 bg-border" />
            </div> : null}
            {providersQuery.data.map((provider) => (
              <Button
                key={provider.id}
                type="button"
                variant="outline"
                className="w-full"
                onClick={() =>
                  window.location.assign(
                    authenticationSettingsService.redirectUrl(provider.slug)
                  )
                }
              >
                {t("auth.sso.continueWith", { provider: provider.name })}
              </Button>
            ))}
          </div>
        ) : null}
        {showSsoLogin && !showLocalLogin && providersQuery.isLoading ? (
          <p className="text-center text-sm text-muted-foreground" role="status">
            {t("common.loading")}
          </p>
        ) : null}
        {showSsoLogin && providersQuery.isSuccess && providersQuery.data.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            {t("auth.sso.noProviders")}
          </p>
        ) : null}
        {showSsoLogin && providersQuery.isError ? (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {t("auth.sso.providersUnavailable")}
          </p>
        ) : null}
      </div>
    </div>
  )
}
