import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FolderRoot, FolderTree, Layers3, UserRoundX } from "lucide-react"

import {
  ENTITY_STAT_ACCENTS,
  EntityStatsCards,
  type EntityStatCardDefinition,
} from "@/components/EntityStatsCards"
import { useReleaseManagementCategoryStatistics } from "@/features/release-management/hooks/use-release-management"

export function ReleaseManagementCategoryStatsCards() {
  const { t } = useTranslation()
  const statsQuery = useReleaseManagementCategoryStatistics()

  const items = useMemo<EntityStatCardDefinition[]>(() => {
    const stats = statsQuery.data
    if (!stats) return []

    return [
      {
        key: "total",
        label: t("releaseManagement.categories.stats.total"),
        value: stats.total,
        icon: Layers3,
        accent: ENTITY_STAT_ACCENTS.sky,
      },
      {
        key: "parents",
        label: t("releaseManagement.categories.stats.parents"),
        value: stats.parents,
        icon: FolderRoot,
        accent: ENTITY_STAT_ACCENTS.emerald,
      },
      {
        key: "subcategories",
        label: t("releaseManagement.categories.stats.subcategories"),
        value: stats.subcategories,
        icon: FolderTree,
        accent: ENTITY_STAT_ACCENTS.violet,
      },
      {
        key: "without_assignments",
        label: t("releaseManagement.categories.stats.withoutAssignments"),
        value: stats.without_assignments,
        icon: UserRoundX,
        accent: ENTITY_STAT_ACCENTS.amber,
      },
    ]
  }, [statsQuery.data, t])

  return <EntityStatsCards items={items} isLoading={statsQuery.isLoading} />
}
