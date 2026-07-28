import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  AppWindow,
  Link2,
  UserCheck,
  UserMinus,
} from "lucide-react"

import {
  ENTITY_STAT_ACCENTS,
  EntityStatsCards,
  type EntityStatCardDefinition,
} from "@/components/EntityStatsCards"
import { useAssignmentStatistics } from "@/features/assignments/hooks/use-assignments"

export function AssignmentStatsCards() {
  const { t } = useTranslation()
  const statsQuery = useAssignmentStatistics()

  const items = useMemo<EntityStatCardDefinition[]>(() => {
    const stats = statsQuery.data
    if (!stats) {
      return []
    }

    return [
      {
        key: "open_assignments",
        label: t("assignments.stats.openAssignments"),
        value: stats.open_assignments,
        icon: Link2,
        accent: ENTITY_STAT_ACCENTS.sky,
      },
      {
        key: "ended_assignments",
        label: t("assignments.stats.endedAssignments"),
        value: stats.ended_assignments,
        icon: UserMinus,
        accent: ENTITY_STAT_ACCENTS.amber,
      },
      {
        key: "applications_with_assignments",
        label: t("assignments.stats.applicationsWithAssignments"),
        value: stats.applications_with_assignments,
        icon: AppWindow,
        accent: ENTITY_STAT_ACCENTS.violet,
      },
      {
        key: "assigned_users",
        label: t("assignments.stats.assignedUsers"),
        value: stats.assigned_users,
        icon: UserCheck,
        accent: ENTITY_STAT_ACCENTS.emerald,
      },
    ]
  }, [statsQuery.data, t])

  return <EntityStatsCards items={items} isLoading={statsQuery.isLoading} />
}
