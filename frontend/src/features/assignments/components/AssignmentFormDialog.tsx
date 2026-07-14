import { useEffect, useMemo } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Combobox } from "@/components/ui/combobox"
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useApplications } from "@/features/applications/hooks/use-applications"
import {
  useAppRolesLookup,
  useCreateBulkAssignment,
} from "@/features/assignments/hooks/use-assignments"
import {
  createBulkAssignmentFormSchema,
  type BulkAssignmentFormValues,
} from "@/features/assignments/types/assignment-schema"
import { useUsers } from "@/features/users/hooks/use-users"
import { getApiFieldErrors } from "@/lib/api-errors"

type AssignmentFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const emptyUserRow = {
  user_id: 0,
  app_role_id: 0,
  is_primary: false,
  remarks: "",
}

const emptyValues: BulkAssignmentFormValues = {
  application_id: 0,
  users: [emptyUserRow],
}

export function AssignmentFormDialog({
  open,
  onOpenChange,
}: AssignmentFormDialogProps) {
  const { t } = useTranslation()
  const createMutation = useCreateBulkAssignment()
  const applicationsQuery = useApplications({
    page: 1,
    per_page: 100,
    sort: "name_en",
  })
  const usersQuery = useUsers({ page: 1, per_page: 100, sort: "first_name" })
  const rolesQuery = useAppRolesLookup()

  const bulkAssignmentFormSchema = useMemo(
    () => createBulkAssignmentFormSchema(t),
    [t]
  )

  const form = useForm<BulkAssignmentFormValues>({
    resolver: zodResolver(bulkAssignmentFormSchema),
    defaultValues: emptyValues,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "users",
  })

  useEffect(() => {
    if (open) {
      form.reset(emptyValues)
    }
  }, [open, form])

  const applicationOptions = useMemo(
    () =>
      (applicationsQuery.data?.items ?? []).map((application) => ({
        value: String(application.id),
        label: `${application.name_en} (${application.code})`,
      })),
    [applicationsQuery.data?.items]
  )

  const userOptions = useMemo(
    () =>
      (usersQuery.data?.items ?? []).map((user) => ({
        value: String(user.id),
        label: `${user.full_name} · ${user.email}`,
      })),
    [usersQuery.data?.items]
  )

  const roleOptions = useMemo(
    () =>
      (rolesQuery.data ?? []).map((role) => ({
        value: String(role.id),
        label: role.name,
      })),
    [rolesQuery.data]
  )

  async function onSubmit(values: BulkAssignmentFormValues) {
    try {
      await createMutation.mutateAsync({
        application_id: values.application_id,
        users: values.users.map((row) => ({
          user_id: row.user_id,
          app_role_id: row.app_role_id,
          is_primary: row.is_primary,
          remarks: row.remarks || null,
        })),
      })
      onOpenChange(false)
      form.reset(emptyValues)
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof BulkAssignmentFormValues, {
            message: messages[0],
          })
        })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("assignments.form.title")}</DialogTitle>
          <DialogDescription>
            {t("assignments.form.bulkDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="application_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("assignments.form.application")}</FormLabel>
                  <FormControl>
                    <Combobox
                      options={applicationOptions}
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(value) =>
                        field.onChange(value ? Number(value) : 0)
                      }
                      placeholder={t("assignments.form.searchApplications")}
                      searchPlaceholder={t("assignments.form.searchApplications")}
                      emptyMessage={t("assignments.form.noApplications")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  {t("assignments.form.usersSection")}
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append(emptyUserRow)}
                >
                  <Plus className="me-1 size-4" />
                  {t("assignments.form.addUser")}
                </Button>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-3 rounded-lg border border-stroke p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {t("assignments.form.userRow", { index: index + 1 })}
                    </p>
                    {fields.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`users.${index}.user_id`}
                      render={({ field: userField }) => (
                        <FormItem>
                          <FormLabel>{t("assignments.form.user")}</FormLabel>
                          <FormControl>
                            <Combobox
                              options={userOptions}
                              value={
                                userField.value
                                  ? String(userField.value)
                                  : undefined
                              }
                              onValueChange={(value) =>
                                userField.onChange(
                                  value ? Number(value) : 0
                                )
                              }
                              placeholder={t("assignments.form.searchUsers")}
                              searchPlaceholder={t("assignments.form.searchUsers")}
                              emptyMessage={t("assignments.form.noUsers")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`users.${index}.app_role_id`}
                      render={({ field: roleField }) => (
                        <FormItem>
                          <FormLabel>{t("assignments.form.appRole")}</FormLabel>
                          <FormControl>
                            <Combobox
                              options={roleOptions}
                              value={
                                roleField.value
                                  ? String(roleField.value)
                                  : undefined
                              }
                              onValueChange={(value) =>
                                roleField.onChange(
                                  value ? Number(value) : 0
                                )
                              }
                              placeholder={t("assignments.form.searchRoles")}
                              searchPlaceholder={t("assignments.form.searchRoles")}
                              emptyMessage={t("assignments.form.noRoles")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`users.${index}.remarks`}
                    render={({ field: remarksField }) => (
                      <FormItem>
                        <FormLabel>{t("assignments.form.remarks")}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t("assignments.form.remarksPlaceholder")}
                            {...remarksField}
                            value={remarksField.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`users.${index}.is_primary`}
                    render={({ field: primaryField }) => (
                      <FormItem className="flex items-start gap-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={primaryField.value}
                            onCheckedChange={(checked) =>
                              primaryField.onChange(checked === true)
                            }
                          />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="font-normal">
                            {t("assignments.form.isPrimary")}
                          </FormLabel>
                          <FormDescription>
                            {t("assignments.form.isPrimaryHint")}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending
                  ? t("assignments.form.assigning")
                  : t("assignments.form.submitBulk")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
