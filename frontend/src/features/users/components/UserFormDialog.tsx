import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  useCreateUser,
  useJobTitlesLookup,
  useUpdateUser,
} from "@/features/users/hooks/use-users"
import type { ManagedUser } from "@/features/users/types/user"
import {
  createUserFormSchemas,
  type UserFormValues,
} from "@/features/users/types/user-schema"
import { useVendors } from "@/features/vendors/hooks/use-vendors"
import { getApiFieldErrors } from "@/lib/api-errors"

type UserFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: ManagedUser | null
}

const emptyValues: UserFormValues = {
  first_name: "",
  last_name: "",
  email: "",
  vendor_id: null,
  phone: "",
  teams: "",
  whatsapp: "",
  extension: "",
  job_title_id: null,
  is_active: true,
  password: "",
  password_confirmation: "",
}

function toFormValues(user?: ManagedUser | null): UserFormValues {
  if (!user) {
    return emptyValues
  }

  return {
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    vendor_id: user.vendor_id,
    phone: user.phone ?? "",
    teams: user.teams ?? "",
    whatsapp: user.whatsapp ?? "",
    extension: user.extension ?? "",
    job_title_id: user.job_title_id,
    is_active: user.is_active,
    password: "",
    password_confirmation: "",
  }
}

export function UserFormDialog({
  open,
  onOpenChange,
  user = null,
}: UserFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(user)
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const vendorsQuery = useVendors({ page: 1, per_page: 100, sort: "name" })
  const jobTitlesQuery = useJobTitlesLookup()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("users.form.editTitle") : t("users.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("users.form.editDescription")
              : t("users.form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <UserFormFields
          key={isEdit ? `edit-${user?.id}` : "create"}
          isEdit={isEdit}
          user={user}
          open={open}
          onOpenChange={onOpenChange}
          vendors={vendorsQuery.data?.items ?? []}
          jobTitles={jobTitlesQuery.data ?? []}
          createMutation={createMutation}
          updateMutation={updateMutation}
        />
      </DialogContent>
    </Dialog>
  )
}

type UserFormFieldsProps = {
  isEdit: boolean
  user?: ManagedUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
  vendors: Array<{ id: number; name: string }>
  jobTitles: Array<{ id: number; name_en: string; name_ar: string }>
  createMutation: ReturnType<typeof useCreateUser>
  updateMutation: ReturnType<typeof useUpdateUser>
}

function UserFormFields({
  isEdit,
  user,
  open,
  onOpenChange,
  vendors,
  jobTitles,
  createMutation,
  updateMutation,
}: UserFormFieldsProps) {
  const { t } = useTranslation()

  const { createUserFormSchema, updateUserFormSchema } = useMemo(
    () => createUserFormSchemas(t),
    [t]
  )

  const form = useForm<UserFormValues>({
    resolver: zodResolver(isEdit ? updateUserFormSchema : createUserFormSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(user))
    }
  }, [open, user, form])

  const vendorOptions = useMemo(
    () => [
      { value: "none", label: t("users.form.vendorNone") },
      ...vendors.map((vendor) => ({
        value: String(vendor.id),
        label: vendor.name,
      })),
    ],
    [vendors, t]
  )

  const jobTitleOptions = useMemo(
    () => [
      { value: "none", label: t("users.form.jobTitleNone") },
      ...jobTitles.map((title) => ({
        value: String(title.id),
        label: title.name_en,
      })),
    ],
    [jobTitles, t]
  )

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  async function onSubmit(values: UserFormValues) {
    const payload = {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      vendor_id: values.vendor_id ?? null,
      phone: values.phone || null,
      teams: values.teams || null,
      whatsapp: values.whatsapp || null,
      extension: values.extension || null,
      job_title_id: values.job_title_id ?? null,
      is_active: values.is_active,
      ...(values.password
        ? {
            password: values.password,
            password_confirmation: values.password_confirmation ?? undefined,
          }
        : {}),
    }

    try {
      if (isEdit && user) {
        await updateMutation.mutateAsync({ id: user.id, payload })
      } else {
        await createMutation.mutateAsync({
          ...payload,
          password: values.password ?? "",
          password_confirmation: values.password_confirmation ?? "",
        })
      }
      onOpenChange(false)
      form.reset(emptyValues)
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof UserFormValues, {
            message: messages[0],
          })
        })
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.form.firstName")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.form.lastName")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.form.email")}</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="off" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="job_title_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.form.jobTitle")}</FormLabel>
                <FormControl>
                  <Combobox
                    options={jobTitleOptions}
                    value={
                      field.value === null || field.value === undefined
                        ? "none"
                        : String(field.value)
                    }
                    onValueChange={(value) =>
                      field.onChange(
                        value === "none" || value === "" ? null : Number(value)
                      )
                    }
                    placeholder={t("users.form.jobTitle")}
                    searchPlaceholder={t("users.form.searchJobTitles")}
                    emptyMessage={t("jobTitles.emptyTitle")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="vendor_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("users.form.vendor")}</FormLabel>
              <FormControl>
                <Combobox
                  options={vendorOptions}
                  value={
                    field.value === null || field.value === undefined
                      ? "none"
                      : String(field.value)
                  }
                  onValueChange={(value) =>
                    field.onChange(
                      value === "none" || value === "" ? null : Number(value)
                    )
                  }
                  placeholder={t("users.form.vendor")}
                  searchPlaceholder={t("vendors.searchPlaceholder")}
                  emptyMessage={t("vendors.emptyTitle")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.form.phone")}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="extension"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.form.extension")}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="teams"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.form.teams")}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="whatsapp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.form.whatsapp")}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.form.password")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                {isEdit ? (
                  <p className="text-xs text-muted-foreground">
                    {t("users.form.passwordHint")}
                  </p>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password_confirmation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.form.passwordConfirmation")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                {t("users.form.isActive")}
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
              ? t("users.form.saving")
              : isEdit
                ? t("users.form.updateSubmit")
                : t("users.form.createSubmit")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
