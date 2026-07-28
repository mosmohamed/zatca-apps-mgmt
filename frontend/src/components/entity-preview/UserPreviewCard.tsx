import { useTranslation } from "react-i18next"
import { AtSign, Building2, Hash, MessageSquare, Phone } from "lucide-react"

import { CopyableField } from "@/components/entity-preview/CopyableField"
import { PreviewCardHeader } from "@/components/entity-preview/PreviewCardHeader"
import { Badge } from "@/components/ui/badge"
import type { UserPreview } from "@/features/entity-preview/types/entity-preview"
import { formatNumber } from "@/utils/format"

const KNOWN_ROLE_LABEL_KEYS: Record<string, string> = {
  super_admin: "common.superAdmin",
  employee: "common.employee",
}

export function UserPreviewCard({ data }: { data: UserPreview }) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")

  function roleLabel(role: string): string {
    const key = KNOWN_ROLE_LABEL_KEYS[role]
    return key ? t(key) : role
  }

  const jobTitle = data.job_title
    ? isArabic
      ? data.job_title.name_ar
      : data.job_title.name_en
    : null

  return (
    <article className="text-start">
      <PreviewCardHeader
        initials={data.initials}
        title={data.full_name}
        subtitle={jobTitle ?? t("entityPreview.user.noJobTitle")}
        badges={
          <>
            <Badge variant={data.is_active ? "default" : "muted"}>
              {data.is_active ? t("common.active") : t("common.inactive")}
            </Badge>
            <Badge variant={data.vendor ? "outline" : "secondary"}>
              <Building2 className="size-3" />
              {data.vendor ? data.vendor.name : t("entityPreview.user.internal")}
            </Badge>
          </>
        }
      />

      <div className="space-y-2.5 p-4">
        <CopyableField
          icon={AtSign}
          label={t("entityPreview.fields.email")}
          value={data.email}
          href={`mailto:${data.email}`}
        />
        <CopyableField
          icon={Phone}
          label={t("entityPreview.fields.phone")}
          value={data.phone}
          href={data.phone ? `tel:${data.phone}` : undefined}
        />
        <CopyableField
          icon={Hash}
          label={t("entityPreview.fields.extension")}
          value={data.extension}
          monospace
        />
        <CopyableField
          icon={MessageSquare}
          label={t("entityPreview.fields.teams")}
          value={data.teams}
        />
      </div>

      {data.roles.length > 0 ? (
        <div className="border-t border-border/60 px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("entityPreview.fields.roles")}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {data.roles.map((role) => (
              <Badge key={role} variant="secondary">
                {roleLabel(role)}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      <footer className="border-t border-border/60 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
        {t("entityPreview.user.assignmentsCount", {
          value: formatNumber(data.active_assignments_count),
        })}
      </footer>
    </article>
  )
}
