import { useMemo, useState } from "react"
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

type LoginFormValues = {
  email: string
  password: string
}

export function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)

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
      email: "admin@itportfolio.local",
      password: "password",
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
            <p className="text-sm font-semibold tracking-tight">{t("app.name")}</p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("auth.signIn")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("app.subtitle")}</p>
          </div>
        </div>

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
                      placeholder="admin@zatca.sa"
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
      </div>
    </div>
  )
}
