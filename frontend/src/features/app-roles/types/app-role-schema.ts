import type { TFunction } from "i18next"
import { z } from "zod"

export function createAppRoleFormSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(1, t("validation.nameRequired")).max(255),
    description: z.string().trim().optional().nullable(),
    is_active: z.boolean(),
    sort_order: z.number().int().min(0),
  })
}

export type AppRoleFormValues = z.infer<
  ReturnType<typeof createAppRoleFormSchema>
>
