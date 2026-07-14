import type { TFunction } from "i18next"
import { z } from "zod"

export function createRoleFormSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(1, t("validation.nameRequired")).max(255),
  })
}

export type RoleFormValues = z.infer<ReturnType<typeof createRoleFormSchema>>
