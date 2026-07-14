import type { TFunction } from "i18next"
import { z } from "zod"

export function createSettingsFormSchema(t: TFunction) {
  return z.object({
    company_name: z
      .string()
      .trim()
      .min(1, t("validation.nameRequired"))
      .max(255),
    default_timezone: z
      .string()
      .trim()
      .min(1, t("validation.required", { field: t("settings.general.timezone") })),
    default_pagination_size: z.number().int().min(5).max(100),
  })
}

export type SettingsFormValues = z.infer<
  ReturnType<typeof createSettingsFormSchema>
>
