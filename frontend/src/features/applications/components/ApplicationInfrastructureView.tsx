import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Cloud, Globe2, Wrench } from "lucide-react"

import { CollapsibleCard } from "@/components/CollapsibleCard"
import { CopyableValue } from "@/components/CopyableValue"
import { EmptyState } from "@/components/EmptyState"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { Badge } from "@/components/ui/badge"
import { EnvironmentTabs } from "@/features/applications/components/EnvironmentTabs"
import { useApplicationInfrastructure } from "@/features/applications/hooks/use-application-infrastructure"
import { environmentLabel } from "@/features/applications/types/infrastructure"
import {
  INFRASTRUCTURE_COLLECTIONS,
  INFRASTRUCTURE_SECTIONS,
  visibleSectionFields,
  type InfraFieldDef,
  type InfrastructureFieldVisibility,
} from "@/features/applications/types/infrastructure-fields"
import {
  infraCollectionDescription,
  infraCollectionItemLabel,
  infraCollectionTitle,
  infraFieldLabel,
  infraOptionLabel,
  infraSectionDescription,
  infraSectionTitle,
} from "@/features/applications/utils/infrastructure-labels"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { formatDate } from "@/utils/format"

const SECTION_ICONS = {
  hosting: Cloud,
  internet: Globe2,
  operational: Wrench,
} as const

/** Pointers into the secret store are never surfaced in read-only views. */
const HIDDEN_FIELDS: readonly string[] = ["secret_reference"]

type InfrastructureRecord = Record<string, unknown>

type ApplicationInfrastructureViewProps = {
  applicationId: number
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false
  }

  if (typeof value === "string") {
    return value.trim() !== ""
  }

  return true
}

function InfraReadOnlyField({
  definition,
  value,
}: {
  definition: InfraFieldDef
  value: unknown
}) {
  const { t } = useTranslation()
  const label = infraFieldLabel(t, definition.name)

  let content = null

  if (definition.kind === "boolean") {
    content = (
      <Badge
        variant={value === true ? "secondary" : "outline"}
        className="rounded-full"
      >
        {value === true ? t("common.yes") : t("common.no")}
      </Badge>
    )
  } else if (definition.kind === "select") {
    content = (
      <span className="text-sm font-medium">
        {infraOptionLabel(t, definition.name, String(value))}
      </span>
    )
  } else if (definition.kind === "date") {
    content = (
      <span className="text-sm font-medium">{formatDate(String(value))}</span>
    )
  } else if (definition.copyable) {
    content = (
      <CopyableValue
        value={String(value)}
        label={label}
        href={definition.kind === "url" ? String(value) : undefined}
      />
    )
  } else {
    content = (
      <span className="text-sm font-medium break-words">{String(value)}</span>
    )
  }

  return (
    <div className="rounded-lg border border-border/50 bg-muted/25 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1.5">{content}</div>
    </div>
  )
}

function InfraFieldGrid({
  fields,
  source,
}: {
  fields: readonly InfraFieldDef[]
  source: InfrastructureRecord
}) {
  const { t } = useTranslation()
  const populated = fields.filter(
    (definition) =>
      !HIDDEN_FIELDS.includes(definition.name) && hasValue(source[definition.name])
  )

  if (populated.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("applications.infrastructure.emptySection")}
      </p>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {populated.map((definition) => (
        <InfraReadOnlyField
          key={definition.name}
          definition={definition}
          value={source[definition.name]}
        />
      ))}
    </div>
  )
}

export function ApplicationInfrastructureView({
  applicationId,
}: ApplicationInfrastructureViewProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")
  const { can } = useAuth()
  const canView = can("application-infrastructure.view")

  const visibility = useMemo<InfrastructureFieldVisibility>(
    () => ({
      canViewPublic: can("application-infrastructure.view-public"),
      canViewOperational: can("application-infrastructure.view-operational"),
    }),
    [can]
  )

  const infrastructureQuery = useApplicationInfrastructure(
    applicationId,
    canView
  )
  const environments = useMemo(
    () => infrastructureQuery.data?.environments ?? [],
    [infrastructureQuery.data]
  )

  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<
    number | null
  >(null)

  useEffect(() => {
    if (environments.length === 0) {
      return
    }

    setSelectedEnvironmentId((current) => {
      if (
        current !== null &&
        environments.some((entry) => entry.environment.id === current)
      ) {
        return current
      }

      const configured = environments.find((entry) => entry.profile !== null)
      return (configured ?? environments[0]).environment.id
    })
  }, [environments])

  if (!canView) {
    return (
      <EmptyState
        title={t("applications.infrastructure.forbiddenTitle")}
        description={t("applications.infrastructure.forbiddenDescription")}
      />
    )
  }

  if (infrastructureQuery.isLoading) {
    return <LoadingSkeleton variant="cards" />
  }

  if (infrastructureQuery.isError) {
    return (
      <EmptyState
        title={t("applications.infrastructure.loadFailedTitle")}
        description={t("applications.infrastructure.loadFailedDescription")}
        actionLabel={t("errors.tryAgain")}
        onAction={() => void infrastructureQuery.refetch()}
      />
    )
  }

  const selectedEntry =
    environments.find(
      (entry) => entry.environment.id === selectedEnvironmentId
    ) ?? null

  if (environments.length === 0 || !selectedEntry) {
    return (
      <EmptyState
        title={t("applications.infrastructure.noEnvironmentsTitle")}
        description={t("applications.infrastructure.noEnvironmentsDescription")}
      />
    )
  }

  const profile = selectedEntry.profile

  return (
    <div className="space-y-4">
      <EnvironmentTabs
        environments={environments}
        value={selectedEnvironmentId}
        onChange={setSelectedEnvironmentId}
      />

      {!profile ? (
        <EmptyState
          title={t("applications.infrastructure.emptyProfileTitle")}
          description={t("applications.infrastructure.emptyProfileDescription", {
            environment: environmentLabel(selectedEntry.environment, isArabic),
          })}
        />
      ) : (
        <div className="space-y-3">
          {INFRASTRUCTURE_SECTIONS.map((section) => {
            const Icon = SECTION_ICONS[section.key]

            return (
              <CollapsibleCard
                key={section.key}
                title={infraSectionTitle(t, section.key)}
                description={infraSectionDescription(t, section.key)}
                icon={<Icon className="size-4" />}
                defaultOpen
              >
                <InfraFieldGrid
                  fields={visibleSectionFields(section, visibility)}
                  source={profile[section.key] as unknown as InfrastructureRecord}
                />
              </CollapsibleCard>
            )
          })}

          {INFRASTRUCTURE_COLLECTIONS.map((collection) => {
            const rows = profile[
              collection.key
            ] as unknown as InfrastructureRecord[]
            const itemLabel = infraCollectionItemLabel(t, collection.key)

            return (
              <CollapsibleCard
                key={collection.key}
                title={infraCollectionTitle(t, collection.key)}
                description={infraCollectionDescription(t, collection.key)}
                badge={
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    {rows.length}
                  </Badge>
                }
                defaultOpen={rows.length > 0}
                contentClassName="space-y-3"
              >
                {rows.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-stroke px-4 py-6 text-center text-sm text-muted-foreground">
                    {t("applications.infrastructure.emptyCollection", {
                      item: itemLabel,
                    })}
                  </p>
                ) : (
                  rows.map((row, index) => {
                    const titleValue = row[collection.titleField]
                    const heading =
                      typeof titleValue === "string" && titleValue.trim() !== ""
                        ? titleValue
                        : `${itemLabel} ${index + 1}`

                    return (
                      <div
                        key={String(row.id ?? index)}
                        className="rounded-xl border border-border/70 bg-background p-3"
                      >
                        <p className="mb-2.5 text-sm font-semibold">{heading}</p>
                        <InfraFieldGrid
                          fields={collection.fields}
                          source={row}
                        />
                      </div>
                    )
                  })
                )}
              </CollapsibleCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
