import type { TFunction } from "i18next"
import { z } from "zod"

export function createDepartmentFormSchema(t: TFunction) {
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
  })
}

export type DepartmentFormValues = z.infer<
  ReturnType<typeof createDepartmentFormSchema>
>
