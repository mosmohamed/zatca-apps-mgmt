import type { TFunction } from "i18next"
import { z } from "zod"

export function createInfraLevelFormSchema(t: TFunction) {
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
    note_en: z.string().trim().max(255).optional().or(z.literal("")),
    note_ar: z.string().trim().max(255).optional().or(z.literal("")),
    sort_order: z.number().int().min(0),
    is_active: z.boolean(),
  })
}

export type InfraLevelFormValues = z.infer<
  ReturnType<typeof createInfraLevelFormSchema>
>

export function createInfraCategoryFormSchema(t: TFunction) {
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
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    sort_order: z.number().int().min(0),
    is_active: z.boolean(),
  })
}

export type InfraCategoryFormValues = z.infer<
  ReturnType<typeof createInfraCategoryFormSchema>
>

export function createInfraCategoryAssignmentMatrixSchema(t: TFunction) {
  return z.object({
    rows: z
      .array(
        z.object({
          key: z.string(),
          assignment_id: z.number().nullable(),
          user_id: z.number().int().positive(t("validation.userRequired")),
          user_label: z.string(),
          original_infra_level_id: z.number().int(),
          infra_level_id: z
            .number()
            .int()
            .positive(t("operationInfra.assignments.validation.levelRequired")),
          is_existing: z.boolean(),
        })
      )
      .superRefine((rows, ctx) => {
        const seen = new Set<string>()
        rows.forEach((row, index) => {
          if (row.user_id <= 0 || row.infra_level_id <= 0) {
            return
          }
          const key = `${row.user_id}:${row.infra_level_id}`
          if (seen.has(key)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("operationInfra.assignments.validation.duplicateUserLevel"),
              path: [index, "infra_level_id"],
            })
            return
          }
          seen.add(key)
        })
      }),
  })
}

export type InfraCategoryAssignmentMatrixFormValues = z.infer<
  ReturnType<typeof createInfraCategoryAssignmentMatrixSchema>
>
