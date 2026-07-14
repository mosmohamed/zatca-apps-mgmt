import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import { lookupKeys } from "@/features/applications/hooks/use-applications"
import { criticalitiesService } from "@/features/criticalities/services/criticalities-service"
import type { CriticalityPayload } from "@/features/criticalities/types/criticality"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"
import type { ListQueryParams } from "@/types/api"

export const criticalityKeys = {
  all: ["criticalities"] as const,
  lists: () => [...criticalityKeys.all, "list"] as const,
  list: (params: ListQueryParams) =>
    [...criticalityKeys.lists(), params] as const,
}

export function useCriticalities(params: ListQueryParams) {
  return useQuery({
    queryKey: criticalityKeys.list(params),
    queryFn: () => criticalitiesService.list(params),
    placeholderData: (previous) => previous,
  })
}

async function invalidateCriticalityCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: criticalityKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: lookupKeys.criticalities }),
  ])
}

export function useCreateCriticality() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CriticalityPayload) =>
      criticalitiesService.create(payload),
    onSuccess: async () => {
      await invalidateCriticalityCaches(queryClient)
      toast.success(i18n.t("criticalities.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("criticalities.toast.createFailed"))
      )
    },
  })
}

export function useUpdateCriticality() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: CriticalityPayload
    }) => criticalitiesService.update(id, payload),
    onSuccess: async () => {
      await invalidateCriticalityCaches(queryClient)
      toast.success(i18n.t("criticalities.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("criticalities.toast.updateFailed"))
      )
    },
  })
}

export function useDeleteCriticality() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => criticalitiesService.remove(id),
    onSuccess: async () => {
      await invalidateCriticalityCaches(queryClient)
      toast.success(i18n.t("criticalities.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("criticalities.toast.deleteFailed"))
      )
    },
  })
}
