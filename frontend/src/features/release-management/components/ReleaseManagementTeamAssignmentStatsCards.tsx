import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { CircleOff, Network, UserRoundCheck, Users } from "lucide-react"

import {
  ENTITY_STAT_ACCENTS,
  EntityStatsCards,
  type EntityStatCardDefinition,
} from "@/components/EntityStatsCards"
import { useReleaseManagementTeamAssignmentStatistics } from "@/features/release-management/hooks/use-release-management"

export function ReleaseManagementTeamAssignmentStatsCards() {
  const { t } = useTranslation()
  const statsQuery = useReleaseManagementTeamAssignmentStatistics()

  const items = useMemo<EntityStatCardDefinition[]>(() => {
    const stats = statsQuery.data
    if (!stats) return []

    return [
      {
        key: "total",
        label: t("releaseManagement.assignments.stats.total"),
        value: stats.total,
        icon: Users,
        accent: ENTITY_STAT_ACCENTS.sky,
      },
      {
        key: "unique_users",
        label: t("releaseManagement.assignments.stats.uniqueUsers"),
        value: stats.unique_users,
        icon: UserRoundCheck,
        accent: ENTITY_STAT_ACCENTS.emerald,
      },
      {
        key: "assigned_categories",
        label: t("releaseManagement.assignments.stats.assignedCategories"),
        value: stats.assigned_categories,
        icon: Network,
        accent: ENTITY_STAT_ACCENTS.violet,
      },
      {
        key: "unassigned_categories",
        label: t("releaseManagement.assignments.stats.unassignedCategories"),
        value: stats.unassigned_categories,
        icon: CircleOff,
        accent: ENTITY_STAT_ACCENTS.amber,
      },
    ]
  }, [statsQuery.data, t])

  return (
    <EntityStatsCards
      items={items}
      isLoading={statsQuery.isLoading}
      className="xl:grid-cols-4"
    />
  )
}
