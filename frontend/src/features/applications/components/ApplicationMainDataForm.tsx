import { useMemo } from "react"
import type { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Combobox } from "@/components/ui/combobox"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { MultiCombobox } from "@/components/ui/multi-combobox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useApplicationFormLookups } from "@/features/applications/hooks/use-application-form-lookups"
import {
  HA_MODELS,
  type Application,
  type ApplicationOwner,
  type ApplicationPayload,
} from "@/features/applications/types/application"
import type { ApplicationFormValues } from "@/features/applications/types/application-schema"
import { useUsers } from "@/features/users/hooks/use-users"

export const emptyApplicationFormValues: ApplicationFormValues = {
  department_id: 0,
  application_type_id: 0,
  name_ar: "",
  name_en: "",
  code: "",
  status_id: 0,
  criticality_id: 0,
  business_owners: [],
  technical_owners: [],
  support_type_id: 0,
  ha_model: null,
  documentation_url: "",
  repository_url: "",
  technologies: [],
}

export function toApplicationFormValues(
  application?: Application | null
): ApplicationFormValues {
  if (!application) {
    return emptyApplicationFormValues
  }

  return {
    department_id: Number(application.department_id) || 0,
    application_type_id: Number(application.application_type_id) || 0,
    name_ar: application.name_ar,
    name_en: application.name_en,
    code: application.code,
    status_id: Number(application.status_id) || 0,
    criticality_id: Number(application.criticality_id) || 0,
    business_owners: application.business_owners?.map((owner) => owner.id) ?? [],
    technical_owners:
      application.technical_owners?.map((owner) => owner.id) ?? [],
    support_type_id: Number(application.support_type_id) || 0,
    ha_model: application.ha_model,
    documentation_url: application.documentation_url ?? "",
    repository_url: application.repository_url ?? "",
    technologies: application.technologies?.map((item) => item.id) ?? [],
  }
}

export function toApplicationPayload(
  values: ApplicationFormValues
): ApplicationPayload {
  return {
    department_id: values.department_id,
    application_type_id: values.application_type_id,
    name_ar: values.name_ar,
    name_en: values.name_en,
    code: values.code,
    status_id: values.status_id,
    criticality_id: values.criticality_id,
    business_owners: values.business_owners,
    technical_owners: values.technical_owners,
    support_type_id: values.support_type_id,
    ha_model: values.ha_model || null,
    documentation_url: values.documentation_url || null,
    repository_url: values.repository_url || null,
    technologies: values.technologies,
  }
}

function selectValue(id: number): string | undefined {
  return id > 0 ? String(id) : undefined
}

function ownerOptionMeta(
  owner: {
    full_name: string
    email: string
    job_title?: { name_en: string; name_ar: string } | null
    vendor?: { name: string } | null
  },
  isArabic: boolean
): { label: string; description: string } {
  const jobTitle = owner.job_title
    ? isArabic
      ? owner.job_title.name_ar
      : owner.job_title.name_en
    : null

  return {
    label: owner.full_name,
    description: [owner.email, jobTitle, owner.vendor?.name]
      .filter(Boolean)
      .join(" · "),
  }
}

function mergeOwnerOptions(
  users: Array<{
    id: number
    full_name: string
    email: string
    job_title?: { name_en: string; name_ar: string } | null
    vendor?: { name: string } | null
  }>,
  selected: ApplicationOwner[],
  isArabic: boolean
) {
  const byId = new Map<number, (typeof users)[number]>()

  for (const user of users) {
    byId.set(user.id, user)
  }

  for (const owner of selected) {
    if (!byId.has(owner.id)) {
      byId.set(owner.id, owner)
    }
  }

  return Array.from(byId.values()).map((user) => {
    const meta = ownerOptionMeta(user, isArabic)
    return {
      value: String(user.id),
      label: meta.label,
      description: meta.description,
    }
  })
}

type ApplicationMainDataFieldsProps = {
  form: UseFormReturn<ApplicationFormValues>
  disabled?: boolean
  /** When editing, pass the loaded application so current relations stay in the option lists. */
  application?: Application | null
}

/**
 * Field set shared by the create dialog and the full page editor, so both
 * surfaces stay in sync with the application payload contract.
 */
export function ApplicationMainDataFields({
  form,
  disabled = false,
  application = null,
}: ApplicationMainDataFieldsProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")
  const lookups = useApplicationFormLookups(application)
  const usersQuery = useUsers({
    page: 1,
    per_page: 100,
    sort: "first_name",
  })
  const fieldsDisabled = disabled || lookups.isLoading || usersQuery.isLoading

  const technologyOptions = useMemo(
    () =>
      lookups.technologies.map((technology) => ({
        value: String(technology.id),
        label: technology.name,
        description: t(`technologies.categories.${technology.category}`, {
          defaultValue: technology.category,
        }),
      })),
    [lookups.technologies, t]
  )

  const ownerOptions = useMemo(
    () =>
      mergeOwnerOptions(
        usersQuery.data?.items ?? [],
        [
          ...(application?.business_owners ?? []),
          ...(application?.technical_owners ?? []),
        ],
        isArabic
      ),
    [
      application?.business_owners,
      application?.technical_owners,
      isArabic,
      usersQuery.data?.items,
    ]
  )

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="name_en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("applications.form.nameEn")}</FormLabel>
              <FormControl>
                <Input
                  placeholder="HR Portal"
                  disabled={fieldsDisabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name_ar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("applications.form.nameAr")}</FormLabel>
              <FormControl>
                <Input
                  placeholder="بوابة الموارد البشرية"
                  disabled={fieldsDisabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("applications.form.code")}</FormLabel>
              <FormControl>
                <Input
                  placeholder="HR-PORTAL"
                  disabled={fieldsDisabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="department_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("applications.form.department")}</FormLabel>
              <Select
                key={`department-${lookups.isReady}-${field.value}`}
                value={selectValue(field.value)}
                onValueChange={(value) => field.onChange(Number(value))}
                disabled={fieldsDisabled}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t("applications.form.department")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {lookups.departments.map((department) => (
                    <SelectItem
                      key={department.id}
                      value={String(department.id)}
                    >
                      {department.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="application_type_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("applications.form.applicationType")}</FormLabel>
              <Select
                key={`application-type-${lookups.isReady}-${field.value}`}
                value={selectValue(field.value)}
                onValueChange={(value) => field.onChange(Number(value))}
                disabled={fieldsDisabled}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t("applications.form.applicationType")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {lookups.applicationTypes.map((type) => (
                    <SelectItem key={type.id} value={String(type.id)}>
                      {type.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("applications.form.status")}</FormLabel>
              <FormControl>
                <Combobox
                  options={lookups.statuses.map((item) => ({
                    value: String(item.id),
                    label: item.name_en,
                  }))}
                  value={selectValue(field.value)}
                  onValueChange={(value) =>
                    field.onChange(value ? Number(value) : 0)
                  }
                  placeholder={t("applications.form.status")}
                  searchPlaceholder={t("applications.form.status")}
                  emptyMessage={t("empty.defaultDescription")}
                  disabled={fieldsDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="criticality_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("applications.form.criticality")}</FormLabel>
              <FormControl>
                <Combobox
                  options={lookups.criticalities.map((item) => ({
                    value: String(item.id),
                    label: item.name_en,
                  }))}
                  value={selectValue(field.value)}
                  onValueChange={(value) =>
                    field.onChange(value ? Number(value) : 0)
                  }
                  placeholder={t("applications.form.criticality")}
                  searchPlaceholder={t("applications.form.criticality")}
                  emptyMessage={t("empty.defaultDescription")}
                  disabled={fieldsDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="support_type_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("applications.form.supportType")}</FormLabel>
              <FormControl>
                <Combobox
                  options={lookups.supportTypes.map((item) => ({
                    value: String(item.id),
                    label: item.name_en,
                  }))}
                  value={selectValue(field.value)}
                  onValueChange={(value) =>
                    field.onChange(value ? Number(value) : 0)
                  }
                  placeholder={t("applications.form.supportType")}
                  searchPlaceholder={t("applications.form.supportType")}
                  emptyMessage={t("empty.defaultDescription")}
                  disabled={fieldsDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="business_owners"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("applications.form.businessOwner")}</FormLabel>
              <FormControl>
                <MultiCombobox
                  options={ownerOptions}
                  values={(field.value ?? []).map(String)}
                  onValuesChange={(next) =>
                    field.onChange(
                      Array.from(new Set(next.map(Number).filter((id) => id > 0)))
                    )
                  }
                  placeholder={t("applications.form.ownersPlaceholder")}
                  searchPlaceholder={t("applications.form.ownersSearch")}
                  emptyMessage={t("applications.form.ownersEmpty")}
                  disabled={fieldsDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="technical_owners"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("applications.form.technicalOwner")}</FormLabel>
              <FormControl>
                <MultiCombobox
                  options={ownerOptions}
                  values={(field.value ?? []).map(String)}
                  onValuesChange={(next) =>
                    field.onChange(
                      Array.from(new Set(next.map(Number).filter((id) => id > 0)))
                    )
                  }
                  placeholder={t("applications.form.ownersPlaceholder")}
                  searchPlaceholder={t("applications.form.ownersSearch")}
                  emptyMessage={t("applications.form.ownersEmpty")}
                  disabled={fieldsDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="documentation_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("applications.form.documentationUrl")}</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://..."
                  disabled={fieldsDisabled}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="repository_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("applications.form.repositoryUrl")}</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://..."
                  disabled={fieldsDisabled}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="ha_model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("applications.form.haModel")}</FormLabel>
              <Select
                value={field.value ?? "none"}
                onValueChange={(value) =>
                  field.onChange(value === "none" ? null : value)
                }
                disabled={fieldsDisabled}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t("applications.form.haModel")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">
                    {t("applications.form.haModelNone")}
                  </SelectItem>
                  {HA_MODELS.map((model) => (
                    <SelectItem key={model} value={model}>
                      {t(`applications.haModels.${model}`, {
                        defaultValue: model,
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="technologies"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("applications.form.technologies")}</FormLabel>
            <FormControl>
              <MultiCombobox
                options={technologyOptions}
                values={(field.value ?? []).map(String)}
                onValuesChange={(next) => field.onChange(next.map(Number))}
                placeholder={t("applications.form.technologiesPlaceholder")}
                searchPlaceholder={t("applications.form.technologiesSearch")}
                emptyMessage={t("applications.form.technologiesEmpty")}
                disabled={fieldsDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
