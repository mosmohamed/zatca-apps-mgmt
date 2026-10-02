import { VendorsPage } from "@/features/vendors/pages/VendorsPage"
import type { OperationalAreaCode } from "@/lib/operational-areas"

type AreaScopedVendorsPageProps = {
  area: OperationalAreaCode
  viewPermission: string
  titleKey?: string
}

export function AreaScopedVendorsPage({
  area,
  viewPermission,
  titleKey = "vendors.title",
}: AreaScopedVendorsPageProps) {
  return (
    <VendorsPage
      forcedArea={area}
      viewPermission={viewPermission}
      titleKey={titleKey}
      lockArea
    />
  )
}
