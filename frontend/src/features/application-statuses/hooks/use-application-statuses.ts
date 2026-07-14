import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import { lookupKeys } from "@/features/applications/hooks/use-applications"
import { applicationStatusesService } from "@/features/application-statuses/services/application-statuses-service"
import type { ApplicationStatusPayload } from "@/features/application-statuses/types/application-status"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"
import type { ListQueryParams } from "@/types/api"

export const applicationStatusKeys = {
  all: ["application-statuses"] as const,
  lists: () => [...applicationStatusKeys.all, "list"] as const,
  list: (params: ListQueryParams) =>
    [...applicationStatusKeys.lists(), params] as const,
}

export function useApplicationStatuses(params: ListQueryParams) {
  return useQuery({
    queryKey: applicationStatusKeys.list(params),
    queryFn: () => applicationStatusesService.list(params),
    placeholderData: (previous) => previous,
  })
}

async function invalidateApplicationStatusCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: applicationStatusKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: lookupKeys.applicationStatuses }),
  ])
}

export function useCreateApplicationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ApplicationStatusPayload) =>
      applicationStatusesService.create(payload),
    onSuccess: async () => {
      await invalidateApplicationStatusCaches(queryClient)
      toast.success(i18n.t("applicationStatuses.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("applicationStatuses.toast.createFailed")
        )
      )
    },
  })
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: ApplicationStatusPayload
    }) => applicationStatusesService.update(id, payload),
    onSuccess: async () => {
      await invalidateApplicationStatusCaches(queryClient)
      toast.success(i18n.t("applicationStatuses.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("applicationStatuses.toast.updateFailed")
        )
      )
    },
  })
}

export function useDeleteApplicationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => applicationStatusesService.remove(id),
    onSuccess: async () => {
      await invalidateApplicationStatusCaches(queryClient)
      toast.success(i18n.t("applicationStatuses.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("applicationStatuses.toast.deleteFailed")
        )
      )
    },
  })
}
