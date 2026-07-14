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
  useCreateAppRole,
  useUpdateAppRole,
} from "@/features/app-roles/hooks/use-app-roles"
import type { AppRole } from "@/features/app-roles/types/app-role"
import {
  createAppRoleFormSchema,
  type AppRoleFormValues,
} from "@/features/app-roles/types/app-role-schema"
import { getApiFieldErrors } from "@/lib/api-errors"

type AppRoleFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  appRole?: AppRole | null
}

const emptyValues: AppRoleFormValues = {
  name: "",
  description: "",
  is_active: true,
  sort_order: 0,
}

function toFormValues(appRole?: AppRole | null): AppRoleFormValues {
  if (!appRole) {
    return emptyValues
  }

  return {
    name: appRole.name,
    description: appRole.description ?? "",
    is_active: appRole.is_active,
    sort_order: appRole.sort_order,
  }
}

export function AppRoleFormDialog({
  open,
  onOpenChange,
  appRole = null,
}: AppRoleFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(appRole)
  const createMutation = useCreateAppRole()
  const updateMutation = useUpdateAppRole()

  const appRoleFormSchema = useMemo(() => createAppRoleFormSchema(t), [t])

  const form = useForm<AppRoleFormValues>({
    resolver: zodResolver(appRoleFormSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(appRole))
    }
  }, [open, appRole, form])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  async function onSubmit(values: AppRoleFormValues) {
    const payload = {
      name: values.name,
      description: values.description || null,
      is_active: values.is_active,
      sort_order: values.sort_order,
    }

    try {
      if (isEdit && appRole) {
        await updateMutation.mutateAsync({
          id: appRole.id,
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
          form.setError(field as keyof AppRoleFormValues, {
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
              ? t("appRoles.form.editTitle")
              : t("appRoles.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("appRoles.form.editDescription")
              : t("appRoles.form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("appRoles.form.name")}</FormLabel>
                  <FormControl>
                    <Input placeholder="Application Owner" {...field} />
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
                  <FormLabel>{t("appRoles.form.description")}</FormLabel>
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
                  <FormLabel>{t("appRoles.form.sortOrder")}</FormLabel>
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
                    {t("appRoles.form.isActive")}
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
                  ? t("appRoles.form.saving")
                  : isEdit
                    ? t("appRoles.form.updateSubmit")
                    : t("appRoles.form.createSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
