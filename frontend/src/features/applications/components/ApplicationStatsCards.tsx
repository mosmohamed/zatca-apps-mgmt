import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  AppWindow,
  Link2,
  ShieldAlert,
  Wrench,
} from "lucide-react"

import {
  ENTITY_STAT_ACCENTS,
  EntityStatsCards,
  type EntityStatCardDefinition,
} from "@/components/EntityStatsCards"
import { useApplicationStatistics } from "@/features/applications/hooks/use-applications"

export function ApplicationStatsCards() {
  const { t } = useTranslation()
  const statsQuery = useApplicationStatistics()

  const items = useMemo<EntityStatCardDefinition[]>(() => {
    const stats = statsQuery.data
    if (!stats) {
      return []
    }

    return [
      {
        key: "total",
        label: t("applications.stats.total"),
        value: stats.total,
        icon: AppWindow,
        accent: ENTITY_STAT_ACCENTS.sky,
      },
      {
        key: "active",
        label: t("applications.stats.active"),
        value: stats.active,
        icon: ShieldAlert,
        accent: ENTITY_STAT_ACCENTS.emerald,
      },
      {
        key: "maintenance",
        label: t("applications.stats.maintenance"),
        value: stats.maintenance,
        icon: Wrench,
        accent: ENTITY_STAT_ACCENTS.amber,
      },
      {
        key: "with_open_assignments",
        label: t("applications.stats.withOpenAssignments"),
        value: stats.with_open_assignments,
        icon: Link2,
        accent: ENTITY_STAT_ACCENTS.violet,
      },
    ]
  }, [statsQuery.data, t])

  return <EntityStatsCards items={items} isLoading={statsQuery.isLoading} />
}
