import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { CircleOff, Cpu, Link2, Power } from "lucide-react"

import {
  ENTITY_STAT_ACCENTS,
  EntityStatsCards,
  type EntityStatCardDefinition,
} from "@/components/EntityStatsCards"
import { useTechnologyStatistics } from "@/features/technologies/hooks/use-technologies"

export function TechnologyStatsCards() {
  const { t } = useTranslation()
  const statsQuery = useTechnologyStatistics()

  const items = useMemo<EntityStatCardDefinition[]>(() => {
    const stats = statsQuery.data
    if (!stats) {
      return []
    }

    return [
      {
        key: "total",
        label: t("technologies.stats.total"),
        value: stats.total,
        icon: Cpu,
        accent: ENTITY_STAT_ACCENTS.sky,
      },
      {
        key: "active",
        label: t("technologies.stats.active"),
        value: stats.active,
        icon: Power,
        accent: ENTITY_STAT_ACCENTS.emerald,
      },
      {
        key: "inactive",
        label: t("technologies.stats.inactive"),
        value: stats.inactive,
        icon: CircleOff,
        accent: ENTITY_STAT_ACCENTS.amber,
      },
      {
        key: "in_use",
        label: t("technologies.stats.inUse"),
        value: stats.in_use,
        icon: Link2,
        accent: ENTITY_STAT_ACCENTS.violet,
      },
    ]
  }, [statsQuery.data, t])

  return <EntityStatsCards items={items} isLoading={statsQuery.isLoading} />
}
