import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { AppWindow, Building2, FolderOpen, FolderX } from "lucide-react"

import {
  ENTITY_STAT_ACCENTS,
  EntityStatsCards,
  type EntityStatCardDefinition,
} from "@/components/EntityStatsCards"
import { useDepartmentStatistics } from "@/features/departments/hooks/use-departments"

export function DepartmentStatsCards() {
  const { t } = useTranslation()
  const statsQuery = useDepartmentStatistics()

  const items = useMemo<EntityStatCardDefinition[]>(() => {
    const stats = statsQuery.data
    if (!stats) {
      return []
    }

    return [
      {
        key: "total",
        label: t("departments.stats.total"),
        value: stats.total,
        icon: Building2,
        accent: ENTITY_STAT_ACCENTS.sky,
      },
      {
        key: "with_applications",
        label: t("departments.stats.withApplications"),
        value: stats.with_applications,
        icon: FolderOpen,
        accent: ENTITY_STAT_ACCENTS.emerald,
      },
      {
        key: "without_applications",
        label: t("departments.stats.withoutApplications"),
        value: stats.without_applications,
        icon: FolderX,
        accent: ENTITY_STAT_ACCENTS.amber,
      },
      {
        key: "applications",
        label: t("departments.stats.applications"),
        value: stats.applications,
        icon: AppWindow,
        accent: ENTITY_STAT_ACCENTS.violet,
      },
    ]
  }, [statsQuery.data, t])

  return <EntityStatsCards items={items} isLoading={statsQuery.isLoading} />
}
