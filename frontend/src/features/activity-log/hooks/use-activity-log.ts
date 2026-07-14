import { useQuery } from "@tanstack/react-query"

import { activityLogService } from "@/features/activity-log/services/activity-log-service"
import type { ActivityLogFilters } from "@/features/activity-log/types/activity-log"

export const activityLogKeys = {
  all: ["activity-log"] as const,
  list: (filters: ActivityLogFilters) =>
    [...activityLogKeys.all, "list", filters] as const,
  stats: () => [...activityLogKeys.all, "stats"] as const,
}

export function useActivityLog(filters: ActivityLogFilters) {
  return useQuery({
    queryKey: activityLogKeys.list(filters),
    queryFn: () => activityLogService.list(filters),
    placeholderData: (previous) => previous,
  })
}

export function useActivityLogStats() {
  return useQuery({
    queryKey: activityLogKeys.stats(),
    queryFn: () => activityLogService.stats(),
    staleTime: 60_000,
  })
}
