import { useState } from "react"
import { useTranslation } from "react-i18next"

import { EntityHoverCard } from "@/components/entity-preview/EntityHoverCard"
import { PreviewTrigger } from "@/components/entity-preview/PreviewTrigger"
import { UserPreviewCard } from "@/components/entity-preview/UserPreviewCard"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useUserPreview } from "@/features/entity-preview/hooks/use-entity-preview"
import { getApiErrorMessage } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

type UserPreviewLinkProps = {
  userId: number | null | undefined
  name: string
  /** Optional detail route; the trigger only reveals the preview without it. */
  to?: string
  className?: string
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
}

export function UserPreviewLink({
  userId,
  name,
  to,
  className,
  align,
  side,
}: UserPreviewLinkProps) {
  const { t } = useTranslation()
  const { can } = useAuth()
  const canView = can("users.view")
  const [isOpen, setIsOpen] = useState(false)

  const id = typeof userId === "number" && userId > 0 ? userId : null
  const query = useUserPreview(id, isOpen && canView)

  if (!canView || id === null) {
    return <span className={cn("truncate", className)}>{name}</span>
  }

  return (
    <EntityHoverCard
      label={t("entityPreview.user.dialogLabel", { name })}
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
          to={to}
          isOpen={open}
          onActivate={reveal}
          className={className}
        />
      )}
    >
      {query.data ? <UserPreviewCard data={query.data} /> : null}
    </EntityHoverCard>
  )
}
