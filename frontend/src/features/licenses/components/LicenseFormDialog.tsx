import { useEffect, useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  useCreateLicense,
  useUpdateLicense,
} from "@/features/licenses/hooks/use-licenses"
import {
  LICENSE_MODULES,
  type LicenseModuleId,
} from "@/features/licenses/config/license-modules"
import type { License } from "@/features/licenses/types/license"
import {
  createLicenseFormSchema,
  type LicenseFormValues,
} from "@/features/licenses/types/license-schema"
import { getApiFieldErrors } from "@/lib/api-errors"

type LicenseFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  license?: License | null
  moduleId?: LicenseModuleId
}

const emptyValues: LicenseFormValues = {
  publisher: "",
  name: "",
  product: "",
  version: "",
  description: "",
  environment: "",
  licensed: 0,
  used: 0,
  proof_of_entitlement: "",
  start_date: "",
  end_date: "",
}

function toFormValues(license?: License | null): LicenseFormValues {
  if (!license) {
    return emptyValues
  }

  return {
    publisher: license.publisher,
    name: license.name,
    product: license.product,
    version: license.version ?? "",
    description: license.description ?? "",
    environment: license.environment ?? "",
    licensed: license.licensed,
    used: license.used,
    proof_of_entitlement: license.proof_of_entitlement ?? "",
    start_date: license.start_date ?? "",
    end_date: license.end_date ?? "",
  }
}

function toPayload(values: LicenseFormValues) {
  return {
    publisher: values.publisher,
    name: values.name,
    product: values.product,
    version: values.version?.trim() ? values.version.trim() : null,
    description: values.description?.trim() ? values.description.trim() : null,
    environment: values.environment,
    licensed: values.licensed,
    used: values.used,
    proof_of_entitlement: values.proof_of_entitlement?.trim()
      ? values.proof_of_entitlement.trim()
      : null,
    start_date: values.start_date?.trim() ? values.start_date.trim() : null,
    end_date: values.end_date?.trim() ? values.end_date.trim() : null,
  }
}

export function LicenseFormDialog({
  open,
  onOpenChange,
  license = null,
  moduleId = "apps",
}: LicenseFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(license)
  const module = LICENSE_MODULES[moduleId]
  const createMutation = useCreateLicense(moduleId)
  const updateMutation = useUpdateLicense(moduleId)

  const licenseFormSchema = useMemo(
    () =>
      createLicenseFormSchema(t, {
        formProductKey: module.formProductKey,
        formLicensedKey: module.formLicensedKey,
      }),
    [module.formLicensedKey, module.formProductKey, t]
  )

  const form = useForm<LicenseFormValues>({
    resolver: zodResolver(licenseFormSchema),
    defaultValues: emptyValues,
  })

  const licensed = useWatch({ control: form.control, name: "licensed" })
  const used = useWatch({ control: form.control, name: "used" })
  const availablePreview = Math.max(
    0,
    (Number(licensed) || 0) - (Number(used) || 0)
  )

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(license))
    }
  }, [open, license, form])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  async function onSubmit(values: LicenseFormValues) {
    const payload = toPayload(values)

    try {
      if (isEdit && license) {
        await updateMutation.mutateAsync({
          id: license.id,
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
          form.setError(field as keyof LicenseFormValues, {
            message: messages[0],
          })
        })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("licenses.form.editTitle")
              : t("licenses.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("licenses.form.editDescription")
              : t("licenses.form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="publisher"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("licenses.form.publisher")}</FormLabel>
                    <FormControl>
                      <Input placeholder="Microsoft" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("licenses.form.name")}</FormLabel>
                    <FormControl>
                      <Input placeholder="Office 365 E3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="product"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(module.formProductKey)}</FormLabel>
                    <FormControl>
                      <Input placeholder="Microsoft 365" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("licenses.form.version")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="2024"
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
                name="environment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("licenses.form.environment")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("licenses.form.environmentPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="proof_of_entitlement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("licenses.form.proofOfEntitlement")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          "licenses.form.proofOfEntitlementPlaceholder"
                        )}
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
                name="licensed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(module.formLicensedKey)}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={Number.isFinite(field.value) ? field.value : 0}
                        onChange={(event) => {
                          const next = event.target.valueAsNumber
                          field.onChange(
                            Number.isFinite(next) ? next : 0
                          )
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="used"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("licenses.form.used")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={Number.isFinite(field.value) ? field.value : 0}
                        onChange={(event) => {
                          const next = event.target.valueAsNumber
                          field.onChange(
                            Number.isFinite(next) ? next : 0
                          )
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>{t("licenses.form.available")}</FormLabel>
                <FormControl>
                  <Input value={availablePreview} disabled readOnly />
                </FormControl>
                <FormDescription>
                  {t("licenses.form.availableHint")}
                </FormDescription>
              </FormItem>
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("licenses.form.startDate")}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
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
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("licenses.form.endDate")}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("licenses.form.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("licenses.form.descriptionPlaceholder")}
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                    />
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
                  ? t("licenses.form.saving")
                  : isEdit
                    ? t("licenses.form.updateSubmit")
                    : t("licenses.form.createSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
