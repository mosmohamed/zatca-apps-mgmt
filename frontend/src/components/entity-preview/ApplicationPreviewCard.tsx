import { useTranslation } from "react-i18next"
import { BookOpen, Building2, GitBranch, ShieldCheck, UserRound } from "lucide-react"

import { CopyableField } from "@/components/entity-preview/CopyableField"
import { PreviewCardHeader } from "@/components/entity-preview/PreviewCardHeader"
import { Badge } from "@/components/ui/badge"
import type {
  ApplicationPreview,
  PreviewLookup,
} from "@/features/entity-preview/types/entity-preview"
import { formatNumber } from "@/utils/format"

export function ApplicationPreviewCard({ data }: { data: ApplicationPreview }) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")

  function lookupName(lookup: PreviewLookup | null): string | null {
    if (!lookup) {
      return null
    }
    return isArabic ? lookup.name_ar : lookup.name_en
  }

  const displayName = isArabic ? data.name_ar : data.name_en
  const secondaryName = isArabic ? data.name_en : data.name_ar
  const statusName = lookupName(data.status)
  const criticalityName = lookupName(data.criticality)
  const departmentName = lookupName(data.department)
  const typeName = lookupName(data.application_type)

  const initials = displayName.trim().slice(0, 2).toUpperCase()

  return (
    <article className="text-start">
      <PreviewCardHeader
        tone="emerald"
        initials={initials}
        title={displayName}
        subtitle={secondaryName}
        badges={
          <>
            {statusName ? <Badge>{statusName}</Badge> : null}
            {criticalityName ? (
              <Badge variant="outline">
                <ShieldCheck className="size-3" />
                {criticalityName}
              </Badge>
            ) : null}
          </>
        }
      />

      <div className="space-y-2.5 p-4">
        <CopyableField
          label={t("entityPreview.fields.code")}
          value={data.code}
          monospace
        />
        <CopyableField
          icon={Building2}
          label={t("entityPreview.fields.department")}
          value={departmentName}
        />
        <CopyableField
          label={t("entityPreview.fields.type")}
          value={typeName}
        />
        <CopyableField
          icon={UserRound}
          label={t("entityPreview.fields.businessOwner")}
          value={
            (data.business_owners?.length ?? 0) > 0
              ? data.business_owners.map((owner) => owner.full_name).join(", ")
              : null
          }
        />
        <CopyableField
          icon={UserRound}
          label={t("entityPreview.fields.technicalOwner")}
          value={
            (data.technical_owners?.length ?? 0) > 0
              ? data.technical_owners.map((owner) => owner.full_name).join(", ")
              : null
          }
        />
        <CopyableField
          label={t("entityPreview.fields.haModel")}
          value={
            data.ha_model
              ? t(`applications.haModels.${data.ha_model}`, {
                  defaultValue: data.ha_model,
                })
              : null
          }
        />
        {data.documentation_url ? (
          <CopyableField
            icon={BookOpen}
            label={t("entityPreview.fields.documentationUrl")}
            value={data.documentation_url}
            href={data.documentation_url}
          />
        ) : null}
        {data.repository_url ? (
          <CopyableField
            icon={GitBranch}
            label={t("entityPreview.fields.repositoryUrl")}
            value={data.repository_url}
            href={data.repository_url}
          />
        ) : null}
      </div>

      <footer className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border/60 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
        <span>
          {t("entityPreview.application.activeUsers", {
            value: formatNumber(data.active_assignments_count),
          })}
        </span>
        <span>
          {t("entityPreview.application.technologies", {
            value: formatNumber(data.technologies_count),
          })}
        </span>
      </footer>
    </article>
  )
}
