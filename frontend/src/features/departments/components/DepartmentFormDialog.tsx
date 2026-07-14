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
  useCreateDepartment,
  useUpdateDepartment,
} from "@/features/departments/hooks/use-departments"
import type { Department } from "@/features/departments/types/department"
import {
  createDepartmentFormSchema,
  type DepartmentFormValues,
} from "@/features/departments/types/department-schema"
import { getApiFieldErrors } from "@/lib/api-errors"

type DepartmentFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  department?: Department | null
}

const emptyValues: DepartmentFormValues = {
  name_en: "",
  name_ar: "",
}

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department = null,
}: DepartmentFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(department)
  const createMutation = useCreateDepartment()
  const updateMutation = useUpdateDepartment()

  const departmentFormSchema = useMemo(
    () => createDepartmentFormSchema(t),
    [t]
  )

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        department
          ? { name_en: department.name_en, name_ar: department.name_ar }
          : emptyValues
      )
    }
  }, [open, department, form])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  async function onSubmit(values: DepartmentFormValues) {
    try {
      if (isEdit && department) {
        await updateMutation.mutateAsync({
          id: department.id,
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
          form.setError(field as keyof DepartmentFormValues, {
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
              ? t("departments.form.editTitle")
              : t("departments.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("departments.form.editDescription")
              : t("departments.form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("departments.form.nameEn")}</FormLabel>
                  <FormControl>
                    <Input placeholder="Information Technology" {...field} />
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
                  <FormLabel>{t("departments.form.nameAr")}</FormLabel>
                  <FormControl>
                    <Input placeholder="تقنية المعلومات" {...field} />
                  </FormControl>
                  <FormMessage />
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
                  ? t("departments.form.saving")
                  : isEdit
                    ? t("departments.form.updateSubmit")
                    : t("departments.form.createSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
