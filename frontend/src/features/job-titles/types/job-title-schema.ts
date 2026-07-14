import type { TFunction } from "i18next"
import { z } from "zod"

export function createJobTitleFormSchema(t: TFunction) {
  return z.object({
    name_en: z
      .string()
      .trim()
      .min(1, t("validation.nameEnRequired"))
      .max(255),
    name_ar: z
      .string()
      .trim()
      .min(1, t("validation.nameArRequired"))
      .max(255),
    description: z.string().trim().optional().nullable(),
    is_active: z.boolean(),
    sort_order: z.number().int().min(0),
  })
}

export type JobTitleFormValues = z.infer<
  ReturnType<typeof createJobTitleFormSchema>
>
