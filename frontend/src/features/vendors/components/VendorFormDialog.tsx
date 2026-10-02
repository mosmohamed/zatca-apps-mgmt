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
import { MultiCombobox } from "@/components/ui/multi-combobox"
import {
  useCreateVendor,
  useUpdateVendor,
} from "@/features/vendors/hooks/use-vendors"
import type { Vendor } from "@/features/vendors/types/vendor"
import {
  createVendorFormSchema,
  type VendorFormValues,
} from "@/features/vendors/types/vendor-schema"
import { getApiFieldErrors } from "@/lib/api-errors"
import { OPERATIONAL_AREAS } from "@/lib/operational-areas"

type VendorFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendor?: Vendor | null
  defaultAreas?: string[]
  lockAreas?: boolean
}

const emptyValues: VendorFormValues = {
  name: "",
  email: "",
  phone: "",
  contact_person_email: "",
  contact_person_phone: "",
  remarks: "",
  status: true,
  areas: [],
}

function toFormValues(
  vendor?: Vendor | null,
  defaultAreas?: string[]
): VendorFormValues {
  if (!vendor) {
    return {
      ...emptyValues,
      areas: defaultAreas ?? [],
    }
  }

  return {
    name: vendor.name,
    email: vendor.email ?? "",
    phone: vendor.phone ?? "",
    contact_person_email: vendor.contact_person_email ?? "",
    contact_person_phone: vendor.contact_person_phone ?? "",
    remarks: vendor.remarks ?? "",
    status: vendor.status,
    areas: vendor.areas ?? defaultAreas ?? [],
  }
}

export function VendorFormDialog({
  open,
  onOpenChange,
  vendor = null,
  defaultAreas,
  lockAreas = false,
}: VendorFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(vendor)
  const createMutation = useCreateVendor()
  const updateMutation = useUpdateVendor()

  const vendorFormSchema = useMemo(() => createVendorFormSchema(t), [t])

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(vendor, defaultAreas))
    }
  }, [open, vendor, form, defaultAreas])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  async function onSubmit(values: VendorFormValues) {
    const payload = {
      name: values.name,
      email: values.email || null,
      phone: values.phone || null,
      contact_person_email: values.contact_person_email || null,
      contact_person_phone: values.contact_person_phone || null,
      remarks: values.remarks || null,
      status: values.status,
      areas: Array.from(
        new Set([...(values.areas ?? []), ...(defaultAreas ?? [])])
      ),
    }

    try {
      if (isEdit && vendor) {
        await updateMutation.mutateAsync({ id: vendor.id, payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onOpenChange(false)
      form.reset(emptyValues)
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof VendorFormValues, {
            message: messages[0],
          })
        })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("vendors.form.editTitle") : t("vendors.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("vendors.form.editDescription")
              : t("vendors.form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("vendors.form.name")}</FormLabel>
                  <FormControl>
                    <Input placeholder="TechCorp Solutions" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("vendors.form.email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contact@example.com"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("vendors.form.phone")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+966..."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="contact_person_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("vendors.form.contactPersonEmail")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_person_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("vendors.form.contactPersonPhone")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("vendors.form.remarks")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="areas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("vendors.form.areas")}</FormLabel>
                  <FormControl>
                    <MultiCombobox
                      options={OPERATIONAL_AREAS.map((area) => ({
                        value: area,
                        label: t(`operationalAreas.${area}`),
                      }))}
                      values={field.value ?? []}
                      onValuesChange={field.onChange}
                      placeholder={t("vendors.form.areasPlaceholder")}
                      searchPlaceholder={t("vendors.form.searchAreas")}
                      emptyMessage={t("vendors.form.areasEmpty")}
                      disabled={lockAreas}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
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
                    {t("vendors.form.status")}
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
                  ? t("vendors.form.saving")
                  : isEdit
                    ? t("vendors.form.updateSubmit")
                    : t("vendors.form.createSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
