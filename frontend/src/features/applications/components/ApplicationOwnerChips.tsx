import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { UserPreviewLink } from "@/components/entity-preview/UserPreviewLink"
import { Badge } from "@/components/ui/badge"
import type { ApplicationOwner } from "@/features/applications/types/application"
import { cn } from "@/lib/utils"

type ApplicationOwnerChipsProps = {
  owners: ApplicationOwner[] | null | undefined
  className?: string
  emptyLabel?: string
}

/**
 * Renders selected application owners as wrap-friendly chips with hover previews.
 */
export function ApplicationOwnerChips({
  owners,
  className,
  emptyLabel = "—",
}: ApplicationOwnerChipsProps) {
  const { i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")

  const list = owners ?? []

  if (list.length === 0) {
    return <span className="text-muted-foreground">{emptyLabel}</span>
  }

  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {list.map((owner) => {
        const jobTitle = owner.job_title
          ? isArabic
            ? owner.job_title.name_ar
            : owner.job_title.name_en
          : null
        const initials = owner.full_name
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part.charAt(0).toUpperCase())
          .join("")

        return (
          <li key={owner.id}>
            <Badge
              variant="secondary"
              className="max-w-full gap-1.5 rounded-full pe-2.5 ps-1 font-normal"
              title={[owner.full_name, owner.email, jobTitle, owner.vendor?.name]
                .filter(Boolean)
                .join(" · ")}
            >
              <span
                aria-hidden
                className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary"
              >
                {initials || "?"}
              </span>
              <UserPreviewLink
                userId={owner.id}
                name={owner.full_name}
                className="max-w-[10rem] truncate text-xs font-medium no-underline hover:underline"
              />
            </Badge>
          </li>
        )
      })}
    </ul>
  )
}
