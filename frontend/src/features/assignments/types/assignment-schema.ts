import type { TFunction } from "i18next"
import { z } from "zod"

const assignmentUserRowSchema = (t: TFunction) =>
  z.object({
    user_id: z.number().int().positive(t("validation.userRequired")),
    app_role_id: z.number().int().positive(t("validation.appRoleRequired")),
    is_primary: z.boolean(),
    remarks: z.string().trim().optional().nullable(),
  })

export function createBulkAssignmentFormSchema(t: TFunction) {
  return z.object({
    application_id: z
      .number()
      .int()
      .positive(t("validation.applicationRequired")),
    users: z.array(assignmentUserRowSchema(t)).min(1, t("validation.usersRequired")),
  })
}

export type BulkAssignmentFormValues = z.infer<
  ReturnType<typeof createBulkAssignmentFormSchema>
>

export type BulkAssignmentUserRow = BulkAssignmentFormValues["users"][number]
