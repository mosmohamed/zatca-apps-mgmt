import type { TFunction } from "i18next"
import { z } from "zod"

export function createSmartFacilitiesLevelFormSchema(t: TFunction) {
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

export type SmartFacilitiesLevelFormValues = z.infer<
  ReturnType<typeof createSmartFacilitiesLevelFormSchema>
>

export function createSmartFacilitiesCategoryFormSchema(t: TFunction) {
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

export type SmartFacilitiesCategoryFormValues = z.infer<
  ReturnType<typeof createSmartFacilitiesCategoryFormSchema>
>

export function createSmartFacilitiesCategoryAssignmentMatrixSchema(t: TFunction) {
  return z.object({
    rows: z
      .array(
        z.object({
          key: z.string(),
          assignment_id: z.number().nullable(),
          user_id: z.number().int().positive(t("validation.userRequired")),
          user_label: z.string(),
          original_smart_facilities_level_id: z.number().int(),
          smart_facilities_level_id: z
            .number()
            .int()
            .positive(t("smartFacilities.assignments.validation.levelRequired")),
          is_existing: z.boolean(),
        })
      )
      .superRefine((rows, ctx) => {
        const seen = new Set<string>()
        rows.forEach((row, index) => {
          if (row.user_id <= 0 || row.smart_facilities_level_id <= 0) {
            return
          }
          const key = `${row.user_id}:${row.smart_facilities_level_id}`
          if (seen.has(key)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("smartFacilities.assignments.validation.duplicateUserLevel"),
              path: [index, "smart_facilities_level_id"],
            })
            return
          }
          seen.add(key)
        })
      }),
  })
}

export type SmartFacilitiesCategoryAssignmentMatrixFormValues = z.infer<
  ReturnType<typeof createSmartFacilitiesCategoryAssignmentMatrixSchema>
>
