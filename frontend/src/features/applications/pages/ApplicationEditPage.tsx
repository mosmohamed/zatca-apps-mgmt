import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Eye, Save, Server, SlidersHorizontal } from "lucide-react"

import { ConfirmAlertDialog } from "@/components/ConfirmAlertDialog"
import { EmptyState } from "@/components/EmptyState"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApplicationInfrastructureTab } from "@/features/applications/components/ApplicationInfrastructureTab"
import {
  ApplicationMainDataFields,
  emptyApplicationFormValues,
  toApplicationFormValues,
  toApplicationPayload,
} from "@/features/applications/components/ApplicationMainDataForm"
import {
  useApplication,
  useUpdateApplication,
} from "@/features/applications/hooks/use-applications"
import { useApplicationFormLookups } from "@/features/applications/hooks/use-application-form-lookups"
import {
  createApplicationFormSchema,
  type ApplicationFormValues,
} from "@/features/applications/types/application-schema"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning"
import { getApiFieldErrors } from "@/lib/api-errors"

type EditTab = "main" | "infrastructure"

function resolveTab(value: string | null): EditTab {
  return value === "infrastructure" ? "infrastructure" : "main"
}

export function ApplicationEditPage() {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")
  const params = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { can } = useAuth()

  const applicationId = Number(params.id)
  const canUpdate = can("applications.update")
  const canViewInfrastructure = can("application-infrastructure.view")

  const applicationQuery = useApplication(applicationId)
  const updateMutation = useUpdateApplication()
  const application = applicationQuery.data
  const lookups = useApplicationFormLookups(application)

  const applicationFormSchema = useMemo(
    () => createApplicationFormSchema(t),
    [t]
  )

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: emptyApplicationFormValues,
  })

  const [infrastructureDirty, setInfrastructureDirty] = useState(false)
  const [pendingLeave, setPendingLeave] = useState<string | null>(null)

  const activeTab = resolveTab(searchParams.get("tab"))
  const mainDirty = form.formState.isDirty
  const hasUnsavedChanges = mainDirty || infrastructureDirty

  useUnsavedChangesWarning(hasUnsavedChanges)

  useEffect(() => {
    if (!application || !lookups.isReady) {
      return
    }

    form.reset(toApplicationFormValues(application))
    // Hydrate once options are ready for this application identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid resetting on every application object refresh
  }, [application?.id, lookups.isReady])

  const handleInfrastructureDirtyChange = useCallback((dirty: boolean) => {
    setInfrastructureDirty(dirty)
  }, [])

  function changeTab(value: string) {
    const next = resolveTab(value)
    const nextParams = new URLSearchParams(searchParams)

    if (next === "main") {
      nextParams.delete("tab")
    } else {
      nextParams.set("tab", next)
    }

    setSearchParams(nextParams, { replace: true })
  }

  function requestLeave(path: string) {
    if (hasUnsavedChanges) {
      setPendingLeave(path)
      return
    }

    void navigate(path)
  }

  async function onSubmit(values: ApplicationFormValues) {
    if (!application) {
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: application.id,
        payload: toApplicationPayload(values),
      })
      form.reset(values)
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)

      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof ApplicationFormValues, {
            message: messages[0],
          })
        })
      }
    }
  }

  if (!Number.isFinite(applicationId) || applicationId <= 0) {
    return (
      <EmptyState
        title={t("applicationsDetails.invalidId")}
        description={t("applicationsDetails.invalidIdDescription")}
      />
    )
  }

  if (!canUpdate) {
    return (
      <EmptyState
        title={t("errors.forbiddenTitle")}
        description={t("errors.forbiddenDescription")}
      />
    )
  }

  if (applicationQuery.isLoading || (application && lookups.isLoading)) {
    return <LoadingSkeleton variant="form" rows={8} />
  }

  if (lookups.isError) {
    return (
      <EmptyState
        title={t("applications.edit.loadFailedTitle")}
        description={t("applications.edit.loadFailedDescription")}
      />
    )
  }

  if (!application) {
    return (
      <EmptyState
        title={t("applicationsDetails.notFoundTitle")}
        description={t("applicationsDetails.notFoundDescription")}
      />
    )
  }

  const displayName = isArabic ? application.name_ar : application.name_en
  const isSaving = updateMutation.isPending

  return (
    <section className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-stroke/80 bg-gradient-to-br from-sky-50 via-card to-violet-50/70 p-5 shadow-sm dark:from-sky-950/35 dark:via-card dark:to-violet-950/25">
        <div className="pointer-events-none absolute inset-y-0 start-0 w-1 bg-gradient-to-b from-sky-500 via-teal-500 to-violet-500" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ms-2 mb-3 w-fit"
          onClick={() => requestLeave(`/applications/${application.id}`)}
        >
          <ArrowLeft className="rtl:rotate-180" />
          {t("applications.edit.backToDetail")}
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                {displayName}
              </h2>
              {hasUnsavedChanges ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-amber-500/50 text-amber-700 dark:text-amber-300"
                >
                  {t("applications.edit.unsavedBadge")}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1.5 font-mono text-sm text-muted-foreground">
              {application.code}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("applications.edit.subtitle")}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => requestLeave(`/applications/${application.id}`)}
          >
            <Eye />
            {t("applications.edit.viewDetails")}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={changeTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="main">
            <SlidersHorizontal />
            {t("applications.edit.tabs.main")}
          </TabsTrigger>
          <TabsTrigger value="infrastructure" disabled={!canViewInfrastructure}>
            <Server />
            {t("applications.edit.tabs.infrastructure")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main">
          <Card className="border-stroke/80 shadow-sm">
            <CardContent className="pt-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  <ApplicationMainDataFields
                    form={form}
                    disabled={isSaving}
                    application={application}
                  />

                  <div className="flex flex-wrap items-center justify-end gap-2 border-t border-stroke/60 pt-4">
                    {mainDirty ? (
                      <span className="me-auto text-xs text-amber-600 dark:text-amber-400">
                        {t("applications.edit.unsavedBadge")}
                      </span>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        form.reset(toApplicationFormValues(application))
                      }
                      disabled={!mainDirty || isSaving}
                    >
                      {t("applications.edit.discard")}
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      <Save />
                      {isSaving
                        ? t("applications.form.saving")
                        : t("applications.form.updateSubmit")}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="infrastructure">
          <ApplicationInfrastructureTab
            applicationId={application.id}
            onDirtyChange={handleInfrastructureDirtyChange}
          />
        </TabsContent>
      </Tabs>

      <ConfirmAlertDialog
        open={pendingLeave !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingLeave(null)
          }
        }}
        title={t("applications.edit.discardTitle")}
        description={t("applications.edit.discardDescription")}
        confirmLabel={t("applications.edit.leave")}
        onConfirm={() => {
          const target = pendingLeave
          setPendingLeave(null)
          if (target) {
            void navigate(target)
          }
        }}
      />
    </section>
  )
}
