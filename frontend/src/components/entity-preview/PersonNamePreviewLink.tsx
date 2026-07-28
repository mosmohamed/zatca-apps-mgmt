import { useState } from "react"
import { useTranslation } from "react-i18next"

import { EntityHoverCard } from "@/components/entity-preview/EntityHoverCard"
import { PreviewTrigger } from "@/components/entity-preview/PreviewTrigger"
import { UserPreviewCard } from "@/components/entity-preview/UserPreviewCard"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useUserPreviewByName } from "@/features/entity-preview/hooks/use-entity-preview"
import { getApiErrorMessage } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

type PersonNamePreviewLinkProps = {
  name: string | null | undefined
  className?: string
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
}

/**
 * Resolves a free-text person name (e.g. application owners) to a user preview
 * when a matching directory user exists.
 */
export function PersonNamePreviewLink({
  name,
  className,
  align,
  side,
}: PersonNamePreviewLinkProps) {
  const { t } = useTranslation()
  const { can } = useAuth()
  const canView = can("users.view")
  const [isOpen, setIsOpen] = useState(false)

  const trimmed = typeof name === "string" ? name.trim() : ""
  const query = useUserPreviewByName(trimmed, isOpen && canView && trimmed !== "")

  if (!trimmed) {
    return <span className={cn("truncate text-muted-foreground", className)}>—</span>
  }

  if (!canView) {
    return <span className={cn("truncate", className)}>{trimmed}</span>
  }

  const resolved = query.data ?? null
  const notFound = query.isSuccess && resolved === null

  return (
    <EntityHoverCard
      label={t("entityPreview.user.dialogLabel", { name: trimmed })}
      align={align}
      side={side}
      onOpenChange={setIsOpen}
      isLoading={query.isFetching && !query.data && !query.isError && !notFound}
      isError={query.isError}
      errorMessage={
        query.error
          ? getApiErrorMessage(query.error, t("entityPreview.loadFailed"))
          : undefined
      }
      trigger={({ isOpen: open, open: reveal }) => (
        <PreviewTrigger
          name={trimmed}
          isOpen={open}
          onActivate={reveal}
          className={className}
        />
      )}
    >
      {resolved ? (
        <UserPreviewCard data={resolved} />
      ) : notFound ? (
        <div className="space-y-2 p-1">
          <p className="text-sm font-semibold">{trimmed}</p>
          <p className="text-xs text-muted-foreground">
            {t("entityPreview.user.unmatchedName")}
          </p>
        </div>
      ) : null}
    </EntityHoverCard>
  )
}
