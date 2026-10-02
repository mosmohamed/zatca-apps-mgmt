import { UsersPage } from "@/features/users/pages/UsersPage"
import type { OperationalAreaCode } from "@/lib/operational-areas"

type AreaScopedUsersPageProps = {
  area: OperationalAreaCode
  viewPermission: string
  titleKey?: string
}

/**
 * Module Employees screen: same Users UI filtered to a single operational area.
 * Create/update always includes the module area in the payload via defaultAreas.
 */
export function AreaScopedUsersPage({
  area,
  viewPermission,
  titleKey = "users.title",
}: AreaScopedUsersPageProps) {
  return (
    <UsersPage
      forcedArea={area}
      viewPermission={viewPermission}
      titleKey={titleKey}
      lockArea
    />
  )
}
