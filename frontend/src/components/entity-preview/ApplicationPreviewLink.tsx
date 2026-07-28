import { useState } from "react"
import { useTranslation } from "react-i18next"

import { ApplicationPreviewCard } from "@/components/entity-preview/ApplicationPreviewCard"
import { EntityHoverCard } from "@/components/entity-preview/EntityHoverCard"
import { PreviewTrigger } from "@/components/entity-preview/PreviewTrigger"
import { useApplicationPreview } from "@/features/entity-preview/hooks/use-entity-preview"
import { getApiErrorMessage } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

type ApplicationPreviewLinkProps = {
  applicationId: number | null | undefined
  name: string
  /**
   * Detail route. Defaults to the application details page; pass `null` to
   * render a non-navigating trigger.
   */
  to?: string | null
  className?: string
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
}

export function ApplicationPreviewLink({
  applicationId,
  name,
  to,
  className,
  align,
  side,
}: ApplicationPreviewLinkProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const id =
    typeof applicationId === "number" && applicationId > 0 ? applicationId : null
  const query = useApplicationPreview(id, isOpen && id !== null)

  if (id === null) {
    return <span className={cn("truncate", className)}>{name}</span>
  }

  const detailRoute =
    to === null ? undefined : (to ?? `/applications/${id}`)

  return (
    <EntityHoverCard
      label={t("entityPreview.application.dialogLabel", { name })}
      align={align}
      side={side}
      onOpenChange={setIsOpen}
      isLoading={!query.data && !query.isError}
      isError={query.isError}
      errorMessage={
        query.error
          ? getApiErrorMessage(query.error, t("entityPreview.loadFailed"))
          : undefined
      }
      trigger={({ isOpen: open, open: reveal }) => (
        <PreviewTrigger
          name={name}
          to={detailRoute}
          isOpen={open}
          onActivate={reveal}
          className={className}
        />
      )}
    >
      {query.data ? <ApplicationPreviewCard data={query.data} /> : null}
    </EntityHoverCard>
  )
}
