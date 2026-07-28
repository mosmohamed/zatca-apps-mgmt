import { useState } from "react"
import { useTranslation } from "react-i18next"

import { EntityHoverCard } from "@/components/entity-preview/EntityHoverCard"
import { PreviewTrigger } from "@/components/entity-preview/PreviewTrigger"
import { VendorPreviewCard } from "@/components/entity-preview/VendorPreviewCard"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useVendorPreview } from "@/features/entity-preview/hooks/use-entity-preview"
import { getApiErrorMessage } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

type VendorPreviewLinkProps = {
  vendorId: number | null | undefined
  name: string
  to?: string
  className?: string
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
}

export function VendorPreviewLink({
  vendorId,
  name,
  to,
  className,
  align,
  side,
}: VendorPreviewLinkProps) {
  const { t } = useTranslation()
  const { can } = useAuth()
  const canView = can("vendors.view")
  const [isOpen, setIsOpen] = useState(false)

  const id = typeof vendorId === "number" && vendorId > 0 ? vendorId : null
  const query = useVendorPreview(id, isOpen && canView)

  if (!canView || id === null) {
    return <span className={cn("truncate", className)}>{name}</span>
  }

  return (
    <EntityHoverCard
      label={t("entityPreview.vendor.dialogLabel", { name })}
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
      {query.data ? <VendorPreviewCard data={query.data} /> : null}
    </EntityHoverCard>
  )
}
