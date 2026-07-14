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
import { Textarea } from "@/components/ui/textarea"
import {
  useCreateJobTitle,
  useUpdateJobTitle,
} from "@/features/job-titles/hooks/use-job-titles"
import type { JobTitle } from "@/features/job-titles/types/job-title"
import {
  createJobTitleFormSchema,
  type JobTitleFormValues,
} from "@/features/job-titles/types/job-title-schema"
import { getApiFieldErrors } from "@/lib/api-errors"

type JobTitleFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobTitle?: JobTitle | null
}

const emptyValues: JobTitleFormValues = {
  name_en: "",
  name_ar: "",
  description: "",
  is_active: true,
  sort_order: 0,
}

function toFormValues(jobTitle?: JobTitle | null): JobTitleFormValues {
  if (!jobTitle) {
    return emptyValues
  }

  return {
    name_en: jobTitle.name_en,
    name_ar: jobTitle.name_ar,
    description: jobTitle.description ?? "",
    is_active: jobTitle.is_active,
    sort_order: jobTitle.sort_order,
  }
}

export function JobTitleFormDialog({
  open,
  onOpenChange,
  jobTitle = null,
}: JobTitleFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(jobTitle)
  const createMutation = useCreateJobTitle()
  const updateMutation = useUpdateJobTitle()

  const jobTitleFormSchema = useMemo(
    () => createJobTitleFormSchema(t),
    [t]
  )

  const form = useForm<JobTitleFormValues>({
    resolver: zodResolver(jobTitleFormSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(jobTitle))
    }
  }, [open, jobTitle, form])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  async function onSubmit(values: JobTitleFormValues) {
    const payload = {
      name_en: values.name_en,
      name_ar: values.name_ar,
      description: values.description || null,
      is_active: values.is_active,
      sort_order: values.sort_order,
    }

    try {
      if (isEdit && jobTitle) {
        await updateMutation.mutateAsync({
          id: jobTitle.id,
          payload,
        })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onOpenChange(false)
      form.reset(emptyValues)
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof JobTitleFormValues, {
            message: messages[0],
          })
        })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("jobTitles.form.editTitle")
              : t("jobTitles.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("jobTitles.form.editDescription")
              : t("jobTitles.form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("jobTitles.form.nameEn")}</FormLabel>
                  <FormControl>
                    <Input placeholder="Software Engineer" {...field} />
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
                  <FormLabel>{t("jobTitles.form.nameAr")}</FormLabel>
                  <FormControl>
                    <Input placeholder="مهندس برمجيات" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("jobTitles.form.description")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("jobTitles.form.sortOrder")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(event) =>
                        field.onChange(event.target.valueAsNumber || 0)
                      }
                    />
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
                    {t("jobTitles.form.isActive")}
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
                  ? t("jobTitles.form.saving")
                  : isEdit
                    ? t("jobTitles.form.updateSubmit")
                    : t("jobTitles.form.createSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
