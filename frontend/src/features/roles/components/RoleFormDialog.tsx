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
import { useCreateRole, useUpdateRole } from "@/features/roles/hooks/use-roles"
import type { Role } from "@/features/roles/types/role"
import {
  createRoleFormSchema,
  type RoleFormValues,
} from "@/features/roles/types/role-schema"
import { getApiFieldErrors } from "@/lib/api-errors"

type RoleFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: Role | null
  onCreated?: (role: Role) => void
}

const emptyValues: RoleFormValues = { name: "" }

export function RoleFormDialog({
  open,
  onOpenChange,
  role = null,
  onCreated,
}: RoleFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(role)
  const createMutation = useCreateRole()
  const updateMutation = useUpdateRole()

  const roleFormSchema = useMemo(() => createRoleFormSchema(t), [t])

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(role ? { name: role.name } : emptyValues)
    }
  }, [open, role, form])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  async function onSubmit(values: RoleFormValues) {
    try {
      if (isEdit && role) {
        await updateMutation.mutateAsync({ id: role.id, payload: values })
      } else {
        const created = await createMutation.mutateAsync(values)
        onCreated?.(created)
      }
      onOpenChange(false)
      form.reset(emptyValues)
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof RoleFormValues, {
            message: messages[0],
          })
        })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("roles.form.editTitle") : t("roles.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("roles.form.editDescription")
              : t("roles.form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("roles.form.name")}</FormLabel>
                  <FormControl>
                    <Input placeholder="finance_manager" {...field} />
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
                  ? t("roles.form.saving")
                  : isEdit
                    ? t("roles.form.updateSubmit")
                    : t("roles.form.createSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
