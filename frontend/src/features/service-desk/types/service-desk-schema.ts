import type { TFunction } from "i18next"
import { z } from "zod"

export function createServiceDeskLevelFormSchema(t: TFunction) {
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

export type ServiceDeskLevelFormValues = z.infer<
  ReturnType<typeof createServiceDeskLevelFormSchema>
>

export function createServiceDeskCategoryFormSchema(t: TFunction) {
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

export type ServiceDeskCategoryFormValues = z.infer<
  ReturnType<typeof createServiceDeskCategoryFormSchema>
>

export function createServiceDeskCategoryAssignmentMatrixSchema(t: TFunction) {
  return z.object({
    rows: z
      .array(
        z.object({
          key: z.string(),
          assignment_id: z.number().nullable(),
          user_id: z.number().int().positive(t("validation.userRequired")),
          user_label: z.string(),
          original_service_desk_level_id: z.number().int(),
          service_desk_level_id: z
            .number()
            .int()
            .positive(t("serviceDesk.assignments.validation.levelRequired")),
          is_existing: z.boolean(),
        })
      )
      .superRefine((rows, ctx) => {
        const seen = new Set<string>()
        rows.forEach((row, index) => {
          if (row.user_id <= 0 || row.service_desk_level_id <= 0) {
            return
          }
          const key = `${row.user_id}:${row.service_desk_level_id}`
          if (seen.has(key)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("serviceDesk.assignments.validation.duplicateUserLevel"),
              path: [index, "service_desk_level_id"],
            })
            return
          }
          seen.add(key)
        })
      }),
  })
}

export type ServiceDeskCategoryAssignmentMatrixFormValues = z.infer<
  ReturnType<typeof createServiceDeskCategoryAssignmentMatrixSchema>
>
