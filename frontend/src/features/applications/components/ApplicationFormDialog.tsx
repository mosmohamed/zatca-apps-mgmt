import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useApplicationStatusesLookup,
  useApplicationTypesLookup,
  useCriticalitiesLookup,
  useCreateApplication,
  useDepartmentsLookup,
  useSupportTypesLookup,
  useTechnologiesLookup,
  useUpdateApplication,
} from "@/features/applications/hooks/use-applications"
import type { Application } from "@/features/applications/types/application"
import {
  createApplicationFormSchema,
  type ApplicationFormValues,
} from "@/features/applications/types/application-schema"
import { Combobox } from "@/components/ui/combobox"
import { MultiCombobox } from "@/components/ui/multi-combobox"
import { getApiFieldErrors } from "@/lib/api-errors"

type ApplicationFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  application?: Application | null
}

const emptyValues: ApplicationFormValues = {
  department_id: 0,
  application_type_id: 0,
  name_ar: "",
  name_en: "",
  code: "",
  status_id: 0,
  criticality_id: 0,
  business_owner: "",
  technical_owner: "",
  support_type_id: 0,
  documentation_url: "",
  repository_url: "",
  technologies: [],
}

function toFormValues(application?: Application | null): ApplicationFormValues {
  if (!application) {
    return emptyValues
  }

  return {
    department_id: application.department_id,
    application_type_id: application.application_type_id,
    name_ar: application.name_ar,
    name_en: application.name_en,
    code: application.code,
    status_id: application.status_id,
    criticality_id: application.criticality_id,
    business_owner: application.business_owner ?? "",
    technical_owner: application.technical_owner ?? "",
    support_type_id: application.support_type_id,
    documentation_url: application.documentation_url ?? "",
    repository_url: application.repository_url ?? "",
    technologies: application.technologies?.map((item) => item.id) ?? [],
  }
}

function toPayload(values: ApplicationFormValues) {
  return {
    department_id: values.department_id,
    application_type_id: values.application_type_id,
    name_ar: values.name_ar,
    name_en: values.name_en,
    code: values.code,
    status_id: values.status_id,
    criticality_id: values.criticality_id,
    business_owner: values.business_owner || null,
    technical_owner: values.technical_owner || null,
    support_type_id: values.support_type_id,
    documentation_url: values.documentation_url || null,
    repository_url: values.repository_url || null,
    technologies: values.technologies,
  }
}

export function ApplicationFormDialog({
  open,
  onOpenChange,
  application = null,
}: ApplicationFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(application)
  const departmentsQuery = useDepartmentsLookup()
  const typesQuery = useApplicationTypesLookup()
  const statusesQuery = useApplicationStatusesLookup()
  const criticalitiesQuery = useCriticalitiesLookup()
  const supportTypesQuery = useSupportTypesLookup()
  const technologiesQuery = useTechnologiesLookup()
  const createMutation = useCreateApplication()
  const updateMutation = useUpdateApplication()

  const applicationFormSchema = useMemo(
    () => createApplicationFormSchema(t),
    [t]
  )

  const technologyOptions = useMemo(
    () =>
      (technologiesQuery.data ?? []).map((technology) => ({
        value: String(technology.id),
        label: technology.name,
        description: t(`technologies.categories.${technology.category}`, {
          defaultValue: technology.category,
        }),
      })),
    [t, technologiesQuery.data]
  )

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(application))
    }
  }, [open, application, form])

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending

  async function onSubmit(values: ApplicationFormValues) {
    const payload = toPayload(values)

    try {
      if (isEdit && application) {
        await updateMutation.mutateAsync({ id: application.id, payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onOpenChange(false)
      form.reset(emptyValues)
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof ApplicationFormValues, {
            message: messages[0],
          })
        })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("applications.form.editTitle")
              : t("applications.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("applications.form.editDescription")
              : t("applications.form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("applications.form.nameEn")}</FormLabel>
                    <FormControl>
                      <Input placeholder="HR Portal" {...field} />
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
                      <Input placeholder="بوابة الموارد البشرية" {...field} />
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
                      <Input placeholder="HR-PORTAL" {...field} />
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
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t("applications.form.department")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(departmentsQuery.data ?? []).map((department) => (
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
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t("applications.form.applicationType")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(typesQuery.data ?? []).map((type) => (
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
                        options={(statusesQuery.data ?? []).map((item) => ({
                          value: String(item.id),
                          label: item.name_en,
                        }))}
                        value={field.value ? String(field.value) : undefined}
                        onValueChange={(value) =>
                          field.onChange(value ? Number(value) : 0)
                        }
                        placeholder={t("applications.form.status")}
                        searchPlaceholder={t("applications.form.status")}
                        emptyMessage={t("empty.defaultDescription")}
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
                        options={(criticalitiesQuery.data ?? []).map((item) => ({
                          value: String(item.id),
                          label: item.name_en,
                        }))}
                        value={field.value ? String(field.value) : undefined}
                        onValueChange={(value) =>
                          field.onChange(value ? Number(value) : 0)
                        }
                        placeholder={t("applications.form.criticality")}
                        searchPlaceholder={t("applications.form.criticality")}
                        emptyMessage={t("empty.defaultDescription")}
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
                        options={(supportTypesQuery.data ?? []).map((item) => ({
                          value: String(item.id),
                          label: item.name_en,
                        }))}
                        value={field.value ? String(field.value) : undefined}
                        onValueChange={(value) =>
                          field.onChange(value ? Number(value) : 0)
                        }
                        placeholder={t("applications.form.supportType")}
                        searchPlaceholder={t("applications.form.supportType")}
                        emptyMessage={t("empty.defaultDescription")}
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
                name="business_owner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("applications.form.businessOwner")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Optional"
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
                name="technical_owner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("applications.form.technicalOwner")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Optional"
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
                name="documentation_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("applications.form.documentationUrl")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://..."
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
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
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
                      onValuesChange={(next) =>
                        field.onChange(next.map(Number))
                      }
                      placeholder={t("applications.form.technologiesPlaceholder")}
                      searchPlaceholder={t(
                        "applications.form.technologiesSearch"
                      )}
                      emptyMessage={t("applications.form.technologiesEmpty")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t("applications.form.saving")
                  : isEdit
                    ? t("applications.form.updateSubmit")
                    : t("applications.form.createSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
