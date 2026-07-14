import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  useCreateApplicationStatus,
  useUpdateApplicationStatus,
} from "@/features/application-statuses/hooks/use-application-statuses"
import type { ApplicationStatus } from "@/features/application-statuses/types/application-status"
import {
  createApplicationStatusFormSchema,
  type ApplicationStatusFormValues,
} from "@/features/application-statuses/types/application-status-schema"
import { getApiFieldErrors } from "@/lib/api-errors"

type ApplicationStatusFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationStatus?: ApplicationStatus | null
}

const emptyValues: ApplicationStatusFormValues = {
  name_en: "",
  name_ar: "",
  code: "",
  is_active: true,
}

function toFormValues(
  applicationStatus?: ApplicationStatus | null
): ApplicationStatusFormValues {
  if (!applicationStatus) {
    return emptyValues
  }

  return {
    name_en: applicationStatus.name_en,
    name_ar: applicationStatus.name_ar,
    code: applicationStatus.code,
    is_active: applicationStatus.is_active,
  }
}

export function ApplicationStatusFormDialog({
  open,
  onOpenChange,
  applicationStatus = null,
}: ApplicationStatusFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(applicationStatus)
  const createMutation = useCreateApplicationStatus()
  const updateMutation = useUpdateApplicationStatus()

  const applicationStatusFormSchema = useMemo(
    () => createApplicationStatusFormSchema(t),
    [t]
  )

  const form = useForm<ApplicationStatusFormValues>({
    resolver: zodResolver(applicationStatusFormSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(applicationStatus))
    }
  }, [open, applicationStatus, form])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  async function onSubmit(values: ApplicationStatusFormValues) {
    try {
      if (isEdit && applicationStatus) {
        await updateMutation.mutateAsync({
          id: applicationStatus.id,
          payload: values,
        })
      } else {
        await createMutation.mutateAsync(values)
      }
      onOpenChange(false)
      form.reset(emptyValues)
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof ApplicationStatusFormValues, {
            message: messages[0],
          })
        })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("applicationStatuses.form.editTitle")
              : t("applicationStatuses.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("applicationStatuses.form.editDescription")
              : t("applicationStatuses.form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("applicationStatuses.form.nameEn")}</FormLabel>
                  <FormControl>
                    <Input placeholder="Active" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name_ar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("applicationStatuses.form.nameAr")}</FormLabel>
                  <FormControl>
                    <Input placeholder="نشط" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("applicationStatuses.form.code")}</FormLabel>
                  <FormControl>
                    <Input placeholder="active" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 space-y-0 rounded-lg border border-stroke p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    {t("applicationStatuses.form.isActive")}
                  </FormLabel>
                </FormItem>
              )}
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
                  ? t("applicationStatuses.form.saving")
                  : isEdit
                    ? t("applicationStatuses.form.updateSubmit")
                    : t("applicationStatuses.form.createSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
