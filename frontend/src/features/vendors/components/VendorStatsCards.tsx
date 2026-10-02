import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { CircleOff, Truck, UserCheck, Users } from "lucide-react"

import {
  ENTITY_STAT_ACCENTS,
  EntityStatsCards,
  type EntityStatCardDefinition,
} from "@/components/EntityStatsCards"
import { useVendorStatistics } from "@/features/vendors/hooks/use-vendors"

type VendorStatsCardsProps = {
  area?: string
}

export function VendorStatsCards({ area }: VendorStatsCardsProps) {
  const { t } = useTranslation()
  const statsQuery = useVendorStatistics(area)

  const items = useMemo<EntityStatCardDefinition[]>(() => {
    const stats = statsQuery.data
    if (!stats) {
      return []
    }

    return [
      {
        key: "total",
        label: t("vendors.stats.total"),
        value: stats.total,
        icon: Truck,
        accent: ENTITY_STAT_ACCENTS.sky,
      },
      {
        key: "active",
        label: t("vendors.stats.active"),
        value: stats.active,
        icon: Users,
        accent: ENTITY_STAT_ACCENTS.emerald,
      },
      {
        key: "inactive",
        label: t("vendors.stats.inactive"),
        value: stats.inactive,
        icon: CircleOff,
        accent: ENTITY_STAT_ACCENTS.amber,
      },
      {
        key: "with_users",
        label: t("vendors.stats.withUsers"),
        value: stats.with_users,
        icon: UserCheck,
        accent: ENTITY_STAT_ACCENTS.violet,
      },
    ]
  }, [statsQuery.data, t])

  return <EntityStatsCards items={items} isLoading={statsQuery.isLoading} />
}
