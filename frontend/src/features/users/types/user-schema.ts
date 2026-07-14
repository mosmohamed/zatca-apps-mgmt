import type { TFunction } from "i18next"
import { z } from "zod"

export function createUserFormSchemas(t: TFunction) {
  const baseUserSchema = z.object({
    first_name: z
      .string()
      .trim()
      .min(1, t("validation.firstNameRequired"))
      .max(255),
    last_name: z
      .string()
      .trim()
      .min(1, t("validation.lastNameRequired"))
      .max(255),
    email: z
      .string()
      .trim()
      .email(t("validation.emailInvalid"))
      .max(255),
    vendor_id: z.number().int().positive().nullable().optional(),
    phone: z.string().trim().max(50).optional().nullable(),
    teams: z.string().trim().max(255).optional().nullable(),
    whatsapp: z.string().trim().max(50).optional().nullable(),
    extension: z.string().trim().max(50).optional().nullable(),
    job_title_id: z.number().int().positive().nullable().optional(),
    is_active: z.boolean(),
    roles: z.array(z.string()).default([]),
    password: z.string().optional().nullable(),
    password_confirmation: z.string().optional().nullable(),
  })

  const createUserFormSchema = baseUserSchema
    .extend({
      password: z.string().min(8, t("validation.passwordMin")),
      password_confirmation: z
        .string()
        .min(1, t("validation.passwordConfirmationRequired")),
    })
    .refine((values) => values.password === values.password_confirmation, {
      message: t("validation.passwordConfirmationMismatch"),
      path: ["password_confirmation"],
    })

  const updateUserFormSchema = baseUserSchema
    .extend({
      password: z.string().optional().nullable(),
      password_confirmation: z.string().optional().nullable(),
    })
    .superRefine((values, ctx) => {
      const password = values.password?.trim() ?? ""
      const confirmation = values.password_confirmation?.trim() ?? ""

      if (!password && !confirmation) {
        return
      }

      if (password.length < 8) {
        ctx.addIssue({
          code: "custom",
          message: t("validation.passwordMin"),
          path: ["password"],
        })
      }

      if (!confirmation) {
        ctx.addIssue({
          code: "custom",
          message: t("validation.passwordConfirmationRequired"),
          path: ["password_confirmation"],
        })
      }

      if (password !== confirmation) {
        ctx.addIssue({
          code: "custom",
          message: t("validation.passwordConfirmationMismatch"),
          path: ["password_confirmation"],
        })
      }
    })

  return { createUserFormSchema, updateUserFormSchema, baseUserSchema }
}

export type UserFormValues = z.infer<
  ReturnType<typeof createUserFormSchemas>["baseUserSchema"]
>
