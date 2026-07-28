import { useEffect, useMemo, useRef, useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { Copy, Trash2 } from "lucide-react"

import { ConfirmAlertDialog } from "@/components/ConfirmAlertDialog"
import { EmptyState } from "@/components/EmptyState"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { Button } from "@/components/ui/button"
import { EnvironmentTabs } from "@/features/applications/components/EnvironmentTabs"
import { CopyEnvironmentDialog } from "@/features/applications/components/infrastructure/CopyEnvironmentDialog"
import { EnvironmentProfileForm } from "@/features/applications/components/infrastructure/EnvironmentProfileForm"
import {
  useApplicationInfrastructure,
  useCopyEnvironmentInfrastructure,
  useDeleteEnvironmentInfrastructure,
  useUpsertEnvironmentInfrastructure,
} from "@/features/applications/hooks/use-application-infrastructure"
import { environmentLabel } from "@/features/applications/types/infrastructure"
import type { InfrastructureFieldVisibility } from "@/features/applications/types/infrastructure-fields"
import {
  createEnvironmentProfileSchema,
  toEnvironmentProfileFormValues,
  toUpsertEnvironmentPayload,
  type EnvironmentProfileFormValues,
} from "@/features/applications/types/infrastructure-schema"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { getApiFieldErrors } from "@/lib/api-errors"

type ApplicationInfrastructureTabProps = {
  applicationId: number
  onDirtyChange?: (dirty: boolean) => void
}

export function ApplicationInfrastructureTab({
  applicationId,
  onDirtyChange,
}: ApplicationInfrastructureTabProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")
  const { can } = useAuth()

  const canView = can("application-infrastructure.view")
  const canCreate = can("application-infrastructure.create")
  const canUpdate = can("application-infrastructure.update")
  const canDelete = can("application-infrastructure.delete")
  const canCopy = can("application-infrastructure.copy-environment")

  const visibility = useMemo<InfrastructureFieldVisibility>(
    () => ({
      canViewPublic: can("application-infrastructure.view-public"),
      canViewOperational: can("application-infrastructure.view-operational"),
    }),
    [can]
  )

  const infrastructureQuery = useApplicationInfrastructure(
    applicationId,
    canView
  )
  const upsertMutation = useUpsertEnvironmentInfrastructure(applicationId)
  const deleteMutation = useDeleteEnvironmentInfrastructure(applicationId)
  const copyMutation = useCopyEnvironmentInfrastructure(applicationId)

  const environments = useMemo(
    () => infrastructureQuery.data?.environments ?? [],
    [infrastructureQuery.data]
  )

  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<
    number | null
  >(null)
  const [pendingEnvironmentId, setPendingEnvironmentId] = useState<
    number | null
  >(null)
  const [copyOpen, setCopyOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (environments.length === 0) {
      return
    }

    setSelectedEnvironmentId((current) => {
      if (
        current !== null &&
        environments.some((entry) => entry.environment.id === current)
      ) {
        return current
      }

      return environments[0].environment.id
    })
  }, [environments])

  const selectedEntry = useMemo(
    () =>
      environments.find(
        (entry) => entry.environment.id === selectedEnvironmentId
      ) ?? null,
    [environments, selectedEnvironmentId]
  )

  const profile = selectedEntry?.profile ?? null
  const canEdit = profile ? canUpdate : canCreate

  const schema = useMemo(
    () => createEnvironmentProfileSchema(t, visibility),
    [t, visibility]
  )

  const form = useForm<EnvironmentProfileFormValues>({
    resolver: zodResolver(schema) as Resolver<EnvironmentProfileFormValues>,
    defaultValues: toEnvironmentProfileFormValues(null),
  })

  const isDirty = form.formState.isDirty
  const resetSignature = `${selectedEnvironmentId ?? 0}:${profile?.id ?? 0}:${
    profile?.updated_at ?? ""
  }`
  const lastResetSignature = useRef<string | null>(null)
  const lastEnvironmentId = useRef<number | null>(null)

  useEffect(() => {
    if (selectedEnvironmentId === null) {
      return
    }

    const environmentChanged = lastEnvironmentId.current !== selectedEnvironmentId

    if (lastResetSignature.current === resetSignature) {
      return
    }

    if (!environmentChanged && form.formState.isDirty) {
      return
    }

    lastResetSignature.current = resetSignature
    lastEnvironmentId.current = selectedEnvironmentId
    form.reset(toEnvironmentProfileFormValues(profile))
  }, [form, profile, resetSignature, selectedEnvironmentId])

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  useEffect(
    () => () => {
      onDirtyChange?.(false)
    },
    [onDirtyChange]
  )

  if (!canView) {
    return (
      <EmptyState
        title={t("applications.infrastructure.forbiddenTitle")}
        description={t("applications.infrastructure.forbiddenDescription")}
      />
    )
  }

  if (infrastructureQuery.isLoading) {
    return <LoadingSkeleton variant="form" rows={6} />
  }

  if (infrastructureQuery.isError) {
    return (
      <EmptyState
        title={t("applications.infrastructure.loadFailedTitle")}
        description={t("applications.infrastructure.loadFailedDescription")}
        actionLabel={t("errors.tryAgain")}
        onAction={() => void infrastructureQuery.refetch()}
      />
    )
  }

  if (environments.length === 0 || !selectedEntry) {
    return (
      <EmptyState
        title={t("applications.infrastructure.noEnvironmentsTitle")}
        description={t("applications.infrastructure.noEnvironmentsDescription")}
      />
    )
  }

  function requestEnvironmentChange(environmentId: number) {
    if (environmentId === selectedEnvironmentId) {
      return
    }

    if (form.formState.isDirty) {
      setPendingEnvironmentId(environmentId)
      return
    }

    setSelectedEnvironmentId(environmentId)
  }

  async function onSubmit(values: EnvironmentProfileFormValues) {
    if (selectedEnvironmentId === null) {
      return
    }

    try {
      await upsertMutation.mutateAsync({
        environmentId: selectedEnvironmentId,
        payload: toUpsertEnvironmentPayload(values, visibility),
      })
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)

      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          form.setError(field as never, { message: messages[0] })
        })
      }
    }
  }

  const isSaving = upsertMutation.isPending
  const environmentName = environmentLabel(selectedEntry.environment, isArabic)

  return (
    <div className="space-y-4">
      <EnvironmentTabs
        environments={environments}
        value={selectedEnvironmentId}
        onChange={requestEnvironmentChange}
      />

      <div className="flex flex-col gap-3 rounded-xl border border-stroke/80 bg-card p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {selectedEntry.environment.code} · {environmentName}
          </p>
          <p className="text-xs text-muted-foreground">
            {profile
              ? t("applications.infrastructure.profileConfigured")
              : t("applications.infrastructure.profileMissing")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCopy ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCopyOpen(true)}
            >
              <Copy />
              {t("applications.infrastructure.copy.action")}
            </Button>
          ) : null}
          {canDelete && profile ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 />
              {t("applications.infrastructure.deleteProfile")}
            </Button>
          ) : null}
        </div>
      </div>

      {!canEdit ? (
        <p className="rounded-lg border border-dashed border-stroke px-4 py-3 text-sm text-muted-foreground">
          {t("applications.infrastructure.readOnlyNotice")}
        </p>
      ) : null}

      <EnvironmentProfileForm
        form={form}
        visibility={visibility}
        canEdit={canEdit}
        isSaving={isSaving}
        onSubmit={onSubmit}
        onDiscard={() => form.reset(toEnvironmentProfileFormValues(profile))}
      />

      <CopyEnvironmentDialog
        open={copyOpen}
        onOpenChange={setCopyOpen}
        environments={environments}
        targetEnvironmentId={selectedEntry.environment.id}
        isCopying={copyMutation.isPending}
        onCopy={async (payload) => {
          await copyMutation.mutateAsync(payload)
          lastResetSignature.current = null
          form.reset(form.getValues())
        }}
      />

      <ConfirmAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("applications.infrastructure.deleteProfileTitle")}
        description={t("applications.infrastructure.deleteProfileDescription", {
          environment: environmentName,
        })}
        confirming={deleteMutation.isPending}
        onConfirm={async () => {
          if (selectedEnvironmentId === null) {
            return
          }
          await deleteMutation.mutateAsync(selectedEnvironmentId)
          lastResetSignature.current = null
          form.reset(toEnvironmentProfileFormValues(null))
        }}
      />

      <ConfirmAlertDialog
        open={pendingEnvironmentId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingEnvironmentId(null)
          }
        }}
        title={t("applications.edit.discardTitle")}
        description={t("applications.edit.discardDescription")}
        confirmLabel={t("applications.edit.discard")}
        onConfirm={() => {
          if (pendingEnvironmentId !== null) {
            setSelectedEnvironmentId(pendingEnvironmentId)
          }
          setPendingEnvironmentId(null)
        }}
      />
    </div>
  )
}
