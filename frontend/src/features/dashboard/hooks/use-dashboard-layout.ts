import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  dashboardLayoutService,
  type UpdateDashboardLayoutPayload,
} from "@/features/dashboard/services/dashboard-layout-service"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"

export const dashboardLayoutKeys = {
  all: ["dashboard-layout"] as const,
  detail: () => [...dashboardLayoutKeys.all, "detail"] as const,
}

export function useDashboardLayout(enabled = true) {
  return useQuery({
    queryKey: dashboardLayoutKeys.detail(),
    queryFn: () => dashboardLayoutService.get(),
    enabled,
    staleTime: 60_000,
  })
}

export function useUpdateDashboardLayout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateDashboardLayoutPayload) =>
      dashboardLayoutService.update(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(dashboardLayoutKeys.detail(), data)
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("dashboard.layout.saveFailed"))
      )
    },
  })
}

export function useResetDashboardLayout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => dashboardLayoutService.reset(),
    onSuccess: (data) => {
      queryClient.setQueryData(dashboardLayoutKeys.detail(), data)
      toast.success(i18n.t("dashboard.layout.resetSuccess"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("dashboard.layout.resetFailed"))
      )
    },
  })
}
