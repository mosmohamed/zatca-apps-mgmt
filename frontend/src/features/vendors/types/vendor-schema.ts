import type { TFunction } from "i18next"
import { z } from "zod"

export function createVendorFormSchema(t: TFunction) {
  const optionalEmail = z
    .string()
    .trim()
    .max(255)
    .optional()
    .nullable()
    .refine(
      (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      t("validation.emailInvalid")
    )

  return z.object({
    name: z.string().trim().min(1, t("validation.nameRequired")).max(255),
    email: optionalEmail,
    phone: z.string().trim().max(50).optional().nullable(),
    contact_person_email: optionalEmail,
    contact_person_phone: z.string().trim().max(50).optional().nullable(),
    remarks: z.string().trim().optional().nullable(),
    status: z.boolean(),
  })
}

export type VendorFormValues = z.infer<ReturnType<typeof createVendorFormSchema>>
