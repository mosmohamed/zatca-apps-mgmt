import type { TFunction } from "i18next"
import { z } from "zod"

export function createSupportTypeFormSchema(t: TFunction) {
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
    code: z.string().trim().min(1, t("validation.codeRequired")).max(100),
    is_active: z.boolean(),
  })
}

export type SupportTypeFormValues = z.infer<
  ReturnType<typeof createSupportTypeFormSchema>
>
