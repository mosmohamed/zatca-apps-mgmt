import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import { lookupKeys } from "@/features/applications/hooks/use-applications"
import { technologiesService } from "@/features/technologies/services/technologies-service"
import type { TechnologyPayload } from "@/features/technologies/types/technology"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"
import type { ListQueryParams } from "@/types/api"

export const technologyKeys = {
  all: ["technologies"] as const,
  lists: () => [...technologyKeys.all, "list"] as const,
  list: (params: ListQueryParams) =>
    [...technologyKeys.lists(), params] as const,
}

export function useTechnologies(params: ListQueryParams) {
  return useQuery({
    queryKey: technologyKeys.list(params),
    queryFn: () => technologiesService.list(params),
    placeholderData: (previous) => previous,
  })
}

async function invalidateTechnologyCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: technologyKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: lookupKeys.technologies }),
  ])
}

export function useCreateTechnology() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: TechnologyPayload) =>
      technologiesService.create(payload),
    onSuccess: async () => {
      await invalidateTechnologyCaches(queryClient)
      toast.success(i18n.t("technologies.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("technologies.toast.createFailed"))
      )
    },
  })
}

export function useUpdateTechnology() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: TechnologyPayload
    }) => technologiesService.update(id, payload),
    onSuccess: async () => {
      await invalidateTechnologyCaches(queryClient)
      toast.success(i18n.t("technologies.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("technologies.toast.updateFailed"))
      )
    },
  })
}

export function useDeleteTechnology() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => technologiesService.remove(id),
    onSuccess: async () => {
      await invalidateTechnologyCaches(queryClient)
      toast.success(i18n.t("technologies.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("technologies.toast.deleteFailed"))
      )
    },
  })
}
