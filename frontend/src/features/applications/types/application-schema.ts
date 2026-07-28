import type { TFunction } from "i18next"
import { z } from "zod"

import { HA_MODELS } from "@/features/applications/types/application"

export function createApplicationFormSchema(t: TFunction) {
  return z.object({
    department_id: z
      .number()
      .int()
      .positive(t("validation.departmentRequired")),
    application_type_id: z
      .number()
      .int()
      .positive(t("validation.applicationTypeRequired")),
    name_ar: z
      .string()
      .trim()
      .min(1, t("validation.nameArRequired"))
      .max(255),
    name_en: z
      .string()
      .trim()
      .min(1, t("validation.nameEnRequired"))
      .max(255),
    code: z.string().trim().min(1, t("validation.codeRequired")).max(100),
    status_id: z.number().int().positive(t("validation.statusRequired")),
    criticality_id: z
      .number()
      .int()
      .positive(t("validation.criticalityRequired")),
    business_owners: z.array(z.number().int().positive()),
    technical_owners: z.array(z.number().int().positive()),
    support_type_id: z
      .number()
      .int()
      .positive(t("validation.supportTypeRequired")),
    ha_model: z
      .enum(HA_MODELS, {
        error: t("validation.haModelInvalid"),
      })
      .nullable()
      .optional(),
    documentation_url: z
      .string()
      .trim()
      .max(2048)
      .optional()
      .nullable()
      .refine(
        (value) => !value || /^https?:\/\/.+/i.test(value),
        t("validation.urlInvalid")
      ),
    repository_url: z
      .string()
      .trim()
      .max(2048)
      .optional()
      .nullable()
      .refine(
        (value) => !value || /^https?:\/\/.+/i.test(value),
        t("validation.urlInvalid")
      ),
    technologies: z.array(z.number().int().positive()),
  })
}

export type ApplicationFormValues = z.infer<
  ReturnType<typeof createApplicationFormSchema>
>
