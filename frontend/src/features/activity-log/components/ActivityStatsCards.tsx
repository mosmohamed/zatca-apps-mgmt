import { useTranslation } from "react-i18next"
import { AppWindow, ShieldCheck, Truck } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { useActivityLogStats } from "@/features/activity-log/hooks/use-activity-log"
import type { ActivityStatItem } from "@/features/activity-log/types/activity-log"

function StatList({ items }: { items: ActivityStatItem[] }) {
  const { t } = useTranslation()

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("activityLog.stats.empty")}
      </p>
    )
  }

  return (
    <ol className="space-y-2">
      {items.map((item, index) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-2 text-sm"
        >
          <span className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <span className="truncate">{item.name}</span>
          </span>
          <span className="font-semibold tabular-nums">{item.count}</span>
        </li>
      ))}
    </ol>
  )
}

function StatCard({
  icon: Icon,
  title,
  description,
  items,
}: {
  icon: LucideIcon
  title: string
  description: string
  items: ActivityStatItem[]
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div>
          <CardTitle className="text-sm">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <StatList items={items} />
      </CardContent>
    </Card>
  )
}

export function ActivityStatsCards() {
  const { t } = useTranslation()
  const statsQuery = useActivityLogStats()

  if (statsQuery.isLoading) {
    return <LoadingSkeleton variant="cards" />
  }

  const stats = statsQuery.data
  if (!stats) {
    return null
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        icon={ShieldCheck}
        title={t("activityLog.stats.mostActiveAdmins")}
        description={t("activityLog.stats.mostActiveAdminsDesc")}
        items={stats.most_active_admins}
      />
      <StatCard
        icon={AppWindow}
        title={t("activityLog.stats.mostModifiedApplications")}
        description={t("activityLog.stats.mostModifiedApplicationsDesc")}
        items={stats.most_modified_applications}
      />
      <StatCard
        icon={Truck}
        title={t("activityLog.stats.topVendors")}
        description={t("activityLog.stats.topVendorsDesc")}
        items={stats.top_vendors}
      />
    </div>
  )
}
