import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import { lookupKeys } from "@/features/applications/hooks/use-applications"
import { supportTypesService } from "@/features/support-types/services/support-types-service"
import type { SupportTypePayload } from "@/features/support-types/types/support-type"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"
import type { ListQueryParams } from "@/types/api"

export const supportTypeKeys = {
  all: ["support-types"] as const,
  lists: () => [...supportTypeKeys.all, "list"] as const,
  list: (params: ListQueryParams) =>
    [...supportTypeKeys.lists(), params] as const,
}

export function useSupportTypes(params: ListQueryParams) {
  return useQuery({
    queryKey: supportTypeKeys.list(params),
    queryFn: () => supportTypesService.list(params),
    placeholderData: (previous) => previous,
  })
}

async function invalidateSupportTypeCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: supportTypeKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: lookupKeys.supportTypes }),
  ])
}

export function useCreateSupportType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SupportTypePayload) =>
      supportTypesService.create(payload),
    onSuccess: async () => {
      await invalidateSupportTypeCaches(queryClient)
      toast.success(i18n.t("supportTypes.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("supportTypes.toast.createFailed"))
      )
    },
  })
}

export function useUpdateSupportType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: SupportTypePayload
    }) => supportTypesService.update(id, payload),
    onSuccess: async () => {
      await invalidateSupportTypeCaches(queryClient)
      toast.success(i18n.t("supportTypes.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("supportTypes.toast.updateFailed"))
      )
    },
  })
}

export function useDeleteSupportType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => supportTypesService.remove(id),
    onSuccess: async () => {
      await invalidateSupportTypeCaches(queryClient)
      toast.success(i18n.t("supportTypes.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("supportTypes.toast.deleteFailed"))
      )
    },
  })
}
