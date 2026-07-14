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
  useCreateSupportType,
  useUpdateSupportType,
} from "@/features/support-types/hooks/use-support-types"
import type { SupportType } from "@/features/support-types/types/support-type"
import {
  createSupportTypeFormSchema,
  type SupportTypeFormValues,
} from "@/features/support-types/types/support-type-schema"
import { getApiFieldErrors } from "@/lib/api-errors"

type SupportTypeFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  supportType?: SupportType | null
}

const emptyValues: SupportTypeFormValues = {
  name_en: "",
  name_ar: "",
  code: "",
  is_active: true,
}

function toFormValues(supportType?: SupportType | null): SupportTypeFormValues {
  if (!supportType) {
    return emptyValues
  }

  return {
    name_en: supportType.name_en,
    name_ar: supportType.name_ar,
    code: supportType.code,
    is_active: supportType.is_active,
  }
}

export function SupportTypeFormDialog({
  open,
  onOpenChange,
  supportType = null,
}: SupportTypeFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(supportType)
  const createMutation = useCreateSupportType()
  const updateMutation = useUpdateSupportType()

  const supportTypeFormSchema = useMemo(
    () => createSupportTypeFormSchema(t),
    [t]
  )

  const form = useForm<SupportTypeFormValues>({
    resolver: zodResolver(supportTypeFormSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(supportType))
    }
  }, [open, supportType, form])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  async function onSubmit(values: SupportTypeFormValues) {
    try {
      if (isEdit && supportType) {
        await updateMutation.mutateAsync({
          id: supportType.id,
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
          form.setError(field as keyof SupportTypeFormValues, {
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
              ? t("supportTypes.form.editTitle")
              : t("supportTypes.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("supportTypes.form.editDescription")
              : t("supportTypes.form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("supportTypes.form.nameEn")}</FormLabel>
                  <FormControl>
                    <Input placeholder="In-house" {...field} />
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
                  <FormLabel>{t("supportTypes.form.nameAr")}</FormLabel>
                  <FormControl>
                    <Input placeholder="داخلي" {...field} />
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
                  <FormLabel>{t("supportTypes.form.code")}</FormLabel>
                  <FormControl>
                    <Input placeholder="in_house" {...field} />
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
                    {t("supportTypes.form.isActive")}
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
                  ? t("supportTypes.form.saving")
                  : isEdit
                    ? t("supportTypes.form.updateSubmit")
                    : t("supportTypes.form.createSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
