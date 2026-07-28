import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import {
  ApplicationMainDataFields,
  emptyApplicationFormValues,
  toApplicationFormValues,
  toApplicationPayload,
} from "@/features/applications/components/ApplicationMainDataForm"
import {
  useCreateApplication,
  useUpdateApplication,
} from "@/features/applications/hooks/use-applications"
import { useApplicationFormLookups } from "@/features/applications/hooks/use-application-form-lookups"
import type { Application } from "@/features/applications/types/application"
import {
  createApplicationFormSchema,
  type ApplicationFormValues,
} from "@/features/applications/types/application-schema"
import { getApiFieldErrors } from "@/lib/api-errors"

type ApplicationFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  application?: Application | null
}

export function ApplicationFormDialog({
  open,
  onOpenChange,
  application = null,
}: ApplicationFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(application)
  const createMutation = useCreateApplication()
  const updateMutation = useUpdateApplication()
  const lookups = useApplicationFormLookups(application)

  const applicationFormSchema = useMemo(
    () => createApplicationFormSchema(t),
    [t]
  )

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: emptyApplicationFormValues,
  })

  useEffect(() => {
    if (!open) {
      return
    }

    if (application && !lookups.isReady) {
      return
    }

    form.reset(toApplicationFormValues(application))
  }, [open, application, lookups.isReady, form])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  async function onSubmit(values: ApplicationFormValues) {
    const payload = toApplicationPayload(values)

    try {
      if (isEdit && application) {
        await updateMutation.mutateAsync({ id: application.id, payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onOpenChange(false)
      form.reset(emptyApplicationFormValues)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("applications.form.editTitle")
              : t("applications.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("applications.form.editDescription")
              : t("applications.form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ApplicationMainDataFields
              form={form}
              disabled={isSubmitting}
              application={application}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t("applications.form.saving")
                  : isEdit
                    ? t("applications.form.updateSubmit")
                    : t("applications.form.createSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
