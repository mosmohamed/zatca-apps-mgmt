import { useState } from "react"
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form"
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { CollapsibleCard } from "@/components/CollapsibleCard"
import { ConfirmAlertDialog } from "@/components/ConfirmAlertDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { InfraFieldInput } from "@/features/applications/components/infrastructure/InfraFieldInput"
import type { InfraCollectionDef } from "@/features/applications/types/infrastructure-fields"
import {
  createEmptyRow,
  ROW_ID_KEY,
  type EnvironmentProfileFormValues,
  type InfraRowValues,
} from "@/features/applications/types/infrastructure-schema"
import {
  infraCollectionDescription,
  infraCollectionItemLabel,
  infraCollectionTitle,
  infraFieldLabel,
} from "@/features/applications/utils/infrastructure-labels"

type InfraCollectionEditorProps = {
  form: UseFormReturn<EnvironmentProfileFormValues>
  collection: InfraCollectionDef
  disabled?: boolean
}

function summaryText(
  row: InfraRowValues | undefined,
  fields: readonly string[]
): string[] {
  if (!row) {
    return []
  }

  return fields
    .map((name) => row[name])
    .filter(
      (value): value is string | number =>
        (typeof value === "string" && value.trim() !== "") ||
        typeof value === "number"
    )
    .map(String)
}

export function InfraCollectionEditor({
  form,
  collection,
  disabled = false,
}: InfraCollectionEditorProps) {
  const { t } = useTranslation()
  const [pendingRemoval, setPendingRemoval] = useState<number | null>(null)

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: collection.key as "servers",
  })

  const rows = useWatch({
    control: form.control,
    name: collection.key as "servers",
  }) as InfraRowValues[] | undefined

  const itemLabel = infraCollectionItemLabel(t, collection.key)

  return (
    <CollapsibleCard
      title={infraCollectionTitle(t, collection.key)}
      description={infraCollectionDescription(t, collection.key)}
      badge={
        <Badge variant="outline" className="rounded-full text-[10px]">
          {fields.length}
        </Badge>
      }
      actions={
        disabled ? null : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(createEmptyRow(collection.fields))}
          >
            <Plus />
            {t("applications.infrastructure.addRecord", { item: itemLabel })}
          </Button>
        )
      }
      contentClassName="space-y-3"
    >
      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stroke px-4 py-6 text-center text-sm text-muted-foreground">
          {t("applications.infrastructure.emptyCollection", {
            item: itemLabel,
          })}
        </p>
      ) : (
        fields.map((field, index) => {
          const row = rows?.[index]
          const titleValue = row?.[collection.titleField]
          const heading =
            typeof titleValue === "string" && titleValue.trim() !== ""
              ? titleValue
              : `${itemLabel} ${index + 1}`
          const isNew =
            row?.[ROW_ID_KEY] === null || row?.[ROW_ID_KEY] === undefined

          return (
            <CollapsibleCard
              key={field.id}
              title={heading}
              description={
                summaryText(row, collection.summaryFields).join(" · ") ||
                infraFieldLabel(t, collection.titleField)
              }
              defaultOpen={isNew}
              className="border-border/70 bg-background"
              actions={
                disabled ? null : (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => move(index, index - 1)}
                      disabled={index === 0}
                      aria-label={t("applications.infrastructure.moveUp")}
                    >
                      <ChevronUp />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => move(index, index + 1)}
                      disabled={index === fields.length - 1}
                      aria-label={t("applications.infrastructure.moveDown")}
                    >
                      <ChevronDown />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setPendingRemoval(index)}
                      aria-label={`${t("common.delete")} ${heading}`}
                    >
                      <Trash2 />
                    </Button>
                  </>
                )
              }
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {collection.fields.map((definition) => (
                  <InfraFieldInput
                    key={definition.name}
                    control={form.control}
                    name={`${collection.key}.${index}.${definition.name}`}
                    definition={definition}
                    disabled={disabled}
                  />
                ))}
              </div>
            </CollapsibleCard>
          )
        })
      )}

      <ConfirmAlertDialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRemoval(null)
          }
        }}
        title={t("applications.infrastructure.removeRecordTitle", {
          item: itemLabel,
        })}
        description={t("applications.infrastructure.removeRecordDescription")}
        confirmLabel={t("common.delete")}
        onConfirm={() => {
          if (pendingRemoval !== null) {
            remove(pendingRemoval)
          }
          setPendingRemoval(null)
        }}
      />
    </CollapsibleCard>
  )
}
