import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { CircleOff, Link2, UserCheck, Users } from "lucide-react"

import {
  ENTITY_STAT_ACCENTS,
  EntityStatsCards,
  type EntityStatCardDefinition,
} from "@/components/EntityStatsCards"
import { useUserStatistics } from "@/features/users/hooks/use-users"

export function UserStatsCards() {
  const { t } = useTranslation()
  const statsQuery = useUserStatistics()

  const items = useMemo<EntityStatCardDefinition[]>(() => {
    const stats = statsQuery.data
    if (!stats) {
      return []
    }

    return [
      {
        key: "total",
        label: t("users.stats.total"),
        value: stats.total,
        icon: Users,
        accent: ENTITY_STAT_ACCENTS.sky,
      },
      {
        key: "active",
        label: t("users.stats.active"),
        value: stats.active,
        icon: UserCheck,
        accent: ENTITY_STAT_ACCENTS.emerald,
      },
      {
        key: "inactive",
        label: t("users.stats.inactive"),
        value: stats.inactive,
        icon: CircleOff,
        accent: ENTITY_STAT_ACCENTS.amber,
      },
      {
        key: "with_open_assignments",
        label: t("users.stats.withOpenAssignments"),
        value: stats.with_open_assignments,
        icon: Link2,
        accent: ENTITY_STAT_ACCENTS.violet,
      },
    ]
  }, [statsQuery.data, t])

  return <EntityStatsCards items={items} isLoading={statsQuery.isLoading} />
}
