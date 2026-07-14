import type { TFunction } from "i18next"
import { z } from "zod"

import { TECHNOLOGY_CATEGORIES } from "@/features/technologies/types/technology"

export function createTechnologyFormSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(1, t("validation.nameRequired")).max(255),
    category: z.enum(TECHNOLOGY_CATEGORIES, {
      error: t("validation.categoryRequired"),
    }),
    description: z.string().trim().max(5000).optional().nullable(),
    is_active: z.boolean(),
  })
}

export type TechnologyFormValues = z.infer<
  ReturnType<typeof createTechnologyFormSchema>
>
