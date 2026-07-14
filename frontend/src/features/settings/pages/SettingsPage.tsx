import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { ShieldAlert } from "lucide-react"

import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSettings } from "@/features/settings/hooks/use-settings"
import {
  createSettingsFormSchema,
  type SettingsFormValues,
} from "@/features/settings/types/settings-schema"
import { getApiFieldErrors } from "@/lib/api-errors"

const TIMEZONE_OPTIONS = [
  "Asia/Riyadh",
  "Asia/Dubai",
  "Asia/Kuwait",
  "Asia/Qatar",
  "Asia/Bahrain",
  "UTC",
  "Europe/London",
  "Europe/Istanbul",
  "Asia/Kolkata",
  "America/New_York",
] as const

export function SettingsPage() {
  const { t } = useTranslation()
  const { settings, isLoading, isSaving, updateSettings } = useSettings()

  const settingsFormSchema = useMemo(() => createSettingsFormSchema(t), [t])

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      company_name: settings.company_name,
      default_timezone: settings.default_timezone,
      default_pagination_size: settings.default_pagination_size,
    },
  })

  useEffect(() => {
    if (!isLoading) {
      form.reset({
        company_name: settings.company_name,
        default_timezone: settings.default_timezone,
        default_pagination_size: settings.default_pagination_size,
      })
    }
  }, [isLoading, settings, form])

  async function onSubmit(values: SettingsFormValues) {
    try {
      await updateSettings(values)
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof SettingsFormValues, {
            message: messages[0],
          })
        })
      }
    }
  }

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{t("settings.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("settings.description")}</p>
        </div>
        <LoadingSkeleton variant="form" rows={4} />
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t("settings.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("settings.description")}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">{t("settings.tabs.general")}</TabsTrigger>
              <TabsTrigger value="preferences">
                {t("settings.tabs.preferences")}
              </TabsTrigger>
              <TabsTrigger value="security">
                {t("settings.tabs.security")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.general.title")}</CardTitle>
                  <CardDescription>
                    {t("settings.general.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.general.companyName")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.preferences.title")}</CardTitle>
                  <CardDescription>
                    {t("settings.preferences.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="default_timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.general.timezone")}</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIMEZONE_OPTIONS.map((zone) => (
                              <SelectItem key={zone} value={zone}>
                                {zone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="default_pagination_size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("settings.preferences.paginationSize")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={5}
                            max={100}
                            step={5}
                            {...field}
                            onChange={(event) =>
                              field.onChange(event.target.valueAsNumber || 0)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          {t("settings.preferences.paginationSizeHint")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.security.title")}</CardTitle>
                  <CardDescription>
                    {t("settings.security.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3 rounded-lg border border-dashed border-stroke p-4">
                    <ShieldAlert className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {t("settings.security.sessionTimeoutTitle")}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("settings.security.sessionTimeoutNote", {
                          minutes: settings.session_timeout_minutes,
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t("settings.saving") : t("common.save")}
            </Button>
          </div>
        </form>
      </Form>
    </section>
  )
}
