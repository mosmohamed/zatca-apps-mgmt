import { Cloud, Globe2, Save, Wrench } from "lucide-react"
import type { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { CollapsibleCard } from "@/components/CollapsibleCard"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { InfraCollectionEditor } from "@/features/applications/components/infrastructure/InfraCollectionEditor"
import { InfraFieldInput } from "@/features/applications/components/infrastructure/InfraFieldInput"
import {
  INFRASTRUCTURE_COLLECTIONS,
  INFRASTRUCTURE_SECTIONS,
  visibleSectionFields,
  type InfrastructureFieldVisibility,
} from "@/features/applications/types/infrastructure-fields"
import type { EnvironmentProfileFormValues } from "@/features/applications/types/infrastructure-schema"
import {
  infraSectionDescription,
  infraSectionTitle,
} from "@/features/applications/utils/infrastructure-labels"

const SECTION_ICONS = {
  hosting: Cloud,
  internet: Globe2,
  operational: Wrench,
} as const

type EnvironmentProfileFormProps = {
  form: UseFormReturn<EnvironmentProfileFormValues>
  visibility: InfrastructureFieldVisibility
  canEdit: boolean
  isSaving: boolean
  onSubmit: (values: EnvironmentProfileFormValues) => void | Promise<void>
  onDiscard: () => void
}

export function EnvironmentProfileForm({
  form,
  visibility,
  canEdit,
  isSaving,
  onSubmit,
  onDiscard,
}: EnvironmentProfileFormProps) {
  const { t } = useTranslation()
  const disabled = !canEdit || isSaving
  const isDirty = form.formState.isDirty

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(values))}
        className="space-y-3"
      >
        {INFRASTRUCTURE_SECTIONS.map((section) => {
          const Icon = SECTION_ICONS[section.key]
          const fields = visibleSectionFields(section, visibility)

          if (fields.length === 0) {
            return null
          }

          return (
            <CollapsibleCard
              key={section.key}
              title={infraSectionTitle(t, section.key)}
              description={infraSectionDescription(t, section.key)}
              icon={<Icon className="size-4" />}
              defaultOpen={section.key === "hosting"}
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {fields.map((definition) => (
                  <InfraFieldInput
                    key={definition.name}
                    control={form.control}
                    name={`${section.key}.${definition.name}`}
                    definition={definition}
                    disabled={disabled}
                  />
                ))}
              </div>
            </CollapsibleCard>
          )
        })}

        {INFRASTRUCTURE_COLLECTIONS.map((collection) => (
          <InfraCollectionEditor
            key={collection.key}
            form={form}
            collection={collection}
            disabled={disabled}
          />
        ))}

        {canEdit ? (
          <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 rounded-xl border border-stroke/80 bg-card/95 p-3 shadow-sm backdrop-blur">
            {isDirty ? (
              <span className="me-auto text-xs text-amber-600 dark:text-amber-400">
                {t("applications.edit.unsavedBadge")}
              </span>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={onDiscard}
              disabled={!isDirty || isSaving}
            >
              {t("applications.edit.discard")}
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save />
              {isSaving
                ? t("applications.form.saving")
                : t("applications.infrastructure.saveEnvironment")}
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  )
}
