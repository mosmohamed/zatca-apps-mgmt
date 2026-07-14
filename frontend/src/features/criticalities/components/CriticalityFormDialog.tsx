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
  useCreateCriticality,
  useUpdateCriticality,
} from "@/features/criticalities/hooks/use-criticalities"
import type { Criticality } from "@/features/criticalities/types/criticality"
import {
  createCriticalityFormSchema,
  type CriticalityFormValues,
} from "@/features/criticalities/types/criticality-schema"
import { getApiFieldErrors } from "@/lib/api-errors"

type CriticalityFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  criticality?: Criticality | null
}

const emptyValues: CriticalityFormValues = {
  name_en: "",
  name_ar: "",
  code: "",
  is_active: true,
}

function toFormValues(criticality?: Criticality | null): CriticalityFormValues {
  if (!criticality) {
    return emptyValues
  }

  return {
    name_en: criticality.name_en,
    name_ar: criticality.name_ar,
    code: criticality.code,
    is_active: criticality.is_active,
  }
}

export function CriticalityFormDialog({
  open,
  onOpenChange,
  criticality = null,
}: CriticalityFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(criticality)
  const createMutation = useCreateCriticality()
  const updateMutation = useUpdateCriticality()

  const criticalityFormSchema = useMemo(
    () => createCriticalityFormSchema(t),
    [t]
  )

  const form = useForm<CriticalityFormValues>({
    resolver: zodResolver(criticalityFormSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(criticality))
    }
  }, [open, criticality, form])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  async function onSubmit(values: CriticalityFormValues) {
    try {
      if (isEdit && criticality) {
        await updateMutation.mutateAsync({
          id: criticality.id,
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
          form.setError(field as keyof CriticalityFormValues, {
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
              ? t("criticalities.form.editTitle")
              : t("criticalities.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("criticalities.form.editDescription")
              : t("criticalities.form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("criticalities.form.nameEn")}</FormLabel>
                  <FormControl>
                    <Input placeholder="High" {...field} />
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
                  <FormLabel>{t("criticalities.form.nameAr")}</FormLabel>
                  <FormControl>
                    <Input placeholder="عالي" {...field} />
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
                  <FormLabel>{t("criticalities.form.code")}</FormLabel>
                  <FormControl>
                    <Input placeholder="high" {...field} />
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
                    {t("criticalities.form.isActive")}
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
                  ? t("criticalities.form.saving")
                  : isEdit
                    ? t("criticalities.form.updateSubmit")
                    : t("criticalities.form.createSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
