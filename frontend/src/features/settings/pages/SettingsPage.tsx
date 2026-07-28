import { useEffect, useMemo, useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DASHBOARD_WIDGET_KEYS,
  DEFAULT_DASHBOARD_WIDGETS,
  normalizeDashboardWidgetsByRole,
} from "@/features/dashboard/types/dashboard-widgets"
import {
  DEFAULT_DASHBOARD_WIDGET_LAYOUT,
  normalizeDashboardWidgetLayout,
} from "@/features/dashboard/types/widget-layout-config"
import { DashboardWidgetLayoutEditor } from "@/features/settings/components/DashboardWidgetLayoutEditor"
import { useSettings } from "@/features/settings/hooks/use-settings"
import { useAuth } from "@/features/auth/hooks/use-auth"
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
  const { can } = useAuth()
  const canUpdateSettings = can("settings.update")
  const { settings, isLoading, isSaving, updateSettings } = useSettings()
  const [selectedRoleId, setSelectedRoleId] = useState<string>("")

  const settingsFormSchema = useMemo(() => createSettingsFormSchema(t), [t])

  const roleOptions = settings.dashboard_widget_roles ?? []
  const byRoleDefaults = useMemo(
    () =>
      normalizeDashboardWidgetsByRole(
        settings.dashboard_widgets_by_role ?? {},
        roleOptions.map((role) => role.id)
      ),
    [roleOptions, settings.dashboard_widgets_by_role]
  )

  const layoutDefaults = useMemo(
    () =>
      normalizeDashboardWidgetLayout(
        settings.dashboard_widget_layout ?? DEFAULT_DASHBOARD_WIDGET_LAYOUT
      ),
    [settings.dashboard_widget_layout]
  )

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      company_name: settings.company_name,
      sidebar_tagline_en: settings.sidebar_tagline_en,
      sidebar_tagline_ar: settings.sidebar_tagline_ar,
      header_subtitle_en: settings.header_subtitle_en,
      header_subtitle_ar: settings.header_subtitle_ar,
      default_timezone: settings.default_timezone,
      default_pagination_size: settings.default_pagination_size,
      dashboard_widgets_by_role: byRoleDefaults,
      dashboard_widget_layout: layoutDefaults,
    },
  })

  useEffect(() => {
    if (!isLoading) {
      form.reset({
        company_name: settings.company_name,
        sidebar_tagline_en: settings.sidebar_tagline_en,
        sidebar_tagline_ar: settings.sidebar_tagline_ar,
        header_subtitle_en: settings.header_subtitle_en,
        header_subtitle_ar: settings.header_subtitle_ar,
        default_timezone: settings.default_timezone,
        default_pagination_size: settings.default_pagination_size,
        dashboard_widgets_by_role: byRoleDefaults,
        dashboard_widget_layout: layoutDefaults,
      })
    }
  }, [isLoading, settings, form, byRoleDefaults, layoutDefaults])

  useEffect(() => {
    if (roleOptions.length === 0) {
      setSelectedRoleId("")
      return
    }

    setSelectedRoleId((current) => {
      if (current && roleOptions.some((role) => String(role.id) === current)) {
        return current
      }
      return String(roleOptions[0].id)
    })
  }, [roleOptions])

  async function onSubmit(values: SettingsFormValues) {
    if (!canUpdateSettings) {
      return
    }

    try {
      await updateSettings({
        company_name: values.company_name,
        sidebar_tagline_en: values.sidebar_tagline_en,
        sidebar_tagline_ar: values.sidebar_tagline_ar,
        header_subtitle_en: values.header_subtitle_en,
        header_subtitle_ar: values.header_subtitle_ar,
        default_timezone: values.default_timezone,
        default_pagination_size: values.default_pagination_size,
        dashboard_widgets: {
          roles: values.dashboard_widgets_by_role,
        },
        dashboard_widget_layout: values.dashboard_widget_layout,
      })
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
          <fieldset
            disabled={!canUpdateSettings}
            className="min-w-0 space-y-4 disabled:opacity-90"
          >
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">{t("settings.tabs.general")}</TabsTrigger>
              <TabsTrigger value="branding">
                {t("settings.tabs.branding")}
              </TabsTrigger>
              <TabsTrigger value="preferences">
                {t("settings.tabs.preferences")}
              </TabsTrigger>
              <TabsTrigger value="dashboard">
                {t("settings.tabs.dashboard")}
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

            <TabsContent value="branding">
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.branding.title")}</CardTitle>
                  <CardDescription>
                    {t("settings.branding.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="sidebar_tagline_en"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("settings.branding.sidebarTaglineEn")}
                          </FormLabel>
                          <FormControl>
                            <Input dir="ltr" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sidebar_tagline_ar"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("settings.branding.sidebarTaglineAr")}
                          </FormLabel>
                          <FormControl>
                            <Input dir="rtl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="header_subtitle_en"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("settings.branding.headerSubtitleEn")}
                          </FormLabel>
                          <FormControl>
                            <Textarea dir="ltr" rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="header_subtitle_ar"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("settings.branding.headerSubtitleAr")}
                          </FormLabel>
                          <FormControl>
                            <Textarea dir="rtl" rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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

            <TabsContent value="dashboard">
              <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.dashboard.title")}</CardTitle>
                  <CardDescription>
                    {t("settings.dashboard.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {roleOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t("settings.dashboard.noRoles")}
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <FormLabel htmlFor="dashboard-widget-role">
                          {t("settings.dashboard.roleLabel")}
                        </FormLabel>
                        <Select
                          value={selectedRoleId}
                          onValueChange={setSelectedRoleId}
                        >
                          <SelectTrigger
                            id="dashboard-widget-role"
                            className="w-full max-w-md"
                          >
                            <SelectValue
                              placeholder={t("settings.dashboard.rolePlaceholder")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map((role) => (
                              <SelectItem key={role.id} value={String(role.id)}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t("settings.dashboard.roleHint")}
                        </FormDescription>
                      </div>

                      {selectedRoleId ? (
                        <div className="space-y-3">
                          {DASHBOARD_WIDGET_KEYS.map((widgetKey) => {
                            const fieldName =
                              `dashboard_widgets_by_role.${selectedRoleId}.${widgetKey}` as const

                            return (
                              <FormField
                                key={`${selectedRoleId}-${widgetKey}`}
                                control={form.control}
                                name={fieldName}
                                defaultValue={
                                  DEFAULT_DASHBOARD_WIDGETS[widgetKey]
                                }
                                render={({ field }) => (
                                  <FormItem
                                    data-enabled={field.value}
                                    className="flex flex-row items-start gap-3 rounded-xl border border-stroke/80 p-3 transition-colors data-[enabled=true]:border-primary/30 data-[enabled=true]:bg-primary/[0.03]"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        id={`dashboard-widget-${selectedRoleId}-${widgetKey}`}
                                        checked={field.value === true}
                                        onCheckedChange={(checked) =>
                                          field.onChange(checked === true)
                                        }
                                        className="mt-0.5"
                                      />
                                    </FormControl>
                                    <div className="min-w-0 space-y-1">
                                      <FormLabel
                                        htmlFor={`dashboard-widget-${selectedRoleId}-${widgetKey}`}
                                        className="cursor-pointer font-medium leading-none"
                                      >
                                        {t(
                                          `settings.dashboard.widgets.${widgetKey}`
                                        )}
                                      </FormLabel>
                                      <FormDescription>
                                        {t(
                                          `settings.dashboard.widgetHints.${widgetKey}`
                                        )}
                                      </FormDescription>
                                    </div>
                                  </FormItem>
                                )}
                              />
                            )
                          })}
                        </div>
                      ) : null}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.dashboard.layoutCardTitle")}</CardTitle>
                  <CardDescription>
                    {t("settings.dashboard.layoutCardDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="dashboard_widget_layout"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <DashboardWidgetLayoutEditor
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              </div>
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
          </fieldset>

          <div className="flex justify-end">
            {canUpdateSettings ? (
              <Button type="submit" disabled={isSaving}>
                {isSaving ? t("settings.saving") : t("common.save")}
              </Button>
            ) : null}
          </div>
        </form>
      </Form>
    </section>
  )
}
