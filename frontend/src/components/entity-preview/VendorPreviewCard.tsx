import { useTranslation } from "react-i18next"
import { AtSign, Phone, UserRound } from "lucide-react"

import { CopyableField } from "@/components/entity-preview/CopyableField"
import { PreviewCardHeader } from "@/components/entity-preview/PreviewCardHeader"
import { Badge } from "@/components/ui/badge"
import type { VendorPreview } from "@/features/entity-preview/types/entity-preview"
import { formatNumber } from "@/utils/format"

export function VendorPreviewCard({ data }: { data: VendorPreview }) {
  const { t } = useTranslation()

  return (
    <article className="text-start">
      <PreviewCardHeader
        tone="violet"
        initials={data.initials}
        title={data.name}
        subtitle={data.remarks}
        badges={
          <Badge variant={data.status ? "default" : "muted"}>
            {data.status ? t("common.active") : t("common.inactive")}
          </Badge>
        }
      />

      <div className="space-y-2.5 p-4">
        <CopyableField
          icon={AtSign}
          label={t("entityPreview.fields.email")}
          value={data.email}
          href={data.email ? `mailto:${data.email}` : undefined}
        />
        <CopyableField
          icon={Phone}
          label={t("entityPreview.fields.phone")}
          value={data.phone}
          href={data.phone ? `tel:${data.phone}` : undefined}
        />
        <CopyableField
          icon={UserRound}
          label={t("entityPreview.fields.contactPersonEmail")}
          value={data.contact_person_email}
          href={
            data.contact_person_email
              ? `mailto:${data.contact_person_email}`
              : undefined
          }
        />
        <CopyableField
          icon={Phone}
          label={t("entityPreview.fields.contactPersonPhone")}
          value={data.contact_person_phone}
          href={
            data.contact_person_phone
              ? `tel:${data.contact_person_phone}`
              : undefined
          }
        />
      </div>

      <footer className="border-t border-border/60 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
        {t("entityPreview.vendor.usersCount", {
          active: formatNumber(data.active_users_count),
          total: formatNumber(data.users_count),
        })}
      </footer>
    </article>
  )
}
