import type { TFunction } from "i18next"
import { z } from "zod"

export function createLicenseFormSchema(t: TFunction) {
  return z
    .object({
      publisher: z
        .string()
        .trim()
        .min(1, t("validation.required", { field: t("licenses.form.publisher") }))
        .max(255),
      name: z
        .string()
        .trim()
        .min(1, t("validation.nameRequired"))
        .max(255),
      product: z
        .string()
        .trim()
        .min(1, t("validation.required", { field: t("licenses.form.product") }))
        .max(255),
      version: z.string().trim().max(255).optional().nullable(),
      description: z.string().trim().max(5000).optional().nullable(),
      environment: z
        .string()
        .trim()
        .min(1, t("validation.required", { field: t("licenses.form.environment") }))
        .max(255),
      licensed: z
        .number({ error: t("licenses.form.licensedInvalid") })
        .int(t("licenses.form.licensedInvalid"))
        .min(0, t("licenses.form.nonNegative")),
      used: z
        .number({ error: t("licenses.form.usedInvalid") })
        .int(t("licenses.form.usedInvalid"))
        .min(0, t("licenses.form.nonNegative")),
      proof_of_entitlement: z
        .string()
        .trim()
        .max(2048)
        .optional()
        .nullable(),
      start_date: z.string().optional().nullable(),
      end_date: z.string().optional().nullable(),
    })
    .superRefine((values, ctx) => {
      const start = values.start_date?.trim() || null
      const end = values.end_date?.trim() || null

      if (start && end && end < start) {
        ctx.addIssue({
          code: "custom",
          path: ["end_date"],
          message: t("licenses.form.endDateAfterStart"),
        })
      }
    })
}

export type LicenseFormValues = z.infer<
  ReturnType<typeof createLicenseFormSchema>
>
