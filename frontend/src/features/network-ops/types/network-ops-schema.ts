import type { TFunction } from "i18next"
import { z } from "zod"

export function createNetworkOpsLevelFormSchema(t: TFunction) {
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

export type NetworkOpsLevelFormValues = z.infer<
  ReturnType<typeof createNetworkOpsLevelFormSchema>
>

export function createNetworkOpsCategoryFormSchema(t: TFunction) {
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

export type NetworkOpsCategoryFormValues = z.infer<
  ReturnType<typeof createNetworkOpsCategoryFormSchema>
>

export function createNetworkOpsCategoryAssignmentMatrixSchema(t: TFunction) {
  return z.object({
    rows: z
      .array(
        z.object({
          key: z.string(),
          assignment_id: z.number().nullable(),
          user_id: z.number().int().positive(t("validation.userRequired")),
          user_label: z.string(),
          original_network_ops_level_id: z.number().int(),
          network_ops_level_id: z
            .number()
            .int()
            .positive(t("networkOps.assignments.validation.levelRequired")),
          is_existing: z.boolean(),
        })
      )
      .superRefine((rows, ctx) => {
        const seen = new Set<string>()
        rows.forEach((row, index) => {
          if (row.user_id <= 0 || row.network_ops_level_id <= 0) {
            return
          }
          const key = `${row.user_id}:${row.network_ops_level_id}`
          if (seen.has(key)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("networkOps.assignments.validation.duplicateUserLevel"),
              path: [index, "network_ops_level_id"],
            })
            return
          }
          seen.add(key)
        })
      }),
  })
}

export type NetworkOpsCategoryAssignmentMatrixFormValues = z.infer<
  ReturnType<typeof createNetworkOpsCategoryAssignmentMatrixSchema>
>
