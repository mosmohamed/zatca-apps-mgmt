import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import { appRolesService } from "@/features/app-roles/services/app-roles-service"
import type { AppRolePayload } from "@/features/app-roles/types/app-role"
import { assignmentLookupKeys } from "@/features/assignments/hooks/use-assignments"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"
import type { ListQueryParams } from "@/types/api"

export const appRoleKeys = {
  all: ["app-roles"] as const,
  lists: () => [...appRoleKeys.all, "list"] as const,
  list: (params: ListQueryParams) =>
    [...appRoleKeys.lists(), params] as const,
}

export function useAppRoles(params: ListQueryParams) {
  return useQuery({
    queryKey: appRoleKeys.list(params),
    queryFn: () => appRolesService.list(params),
    placeholderData: (previous) => previous,
  })
}

async function invalidateAppRoleCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: appRoleKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: assignmentLookupKeys.appRoles }),
  ])
}

export function useCreateAppRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AppRolePayload) => appRolesService.create(payload),
    onSuccess: async () => {
      await invalidateAppRoleCaches(queryClient)
      toast.success(i18n.t("appRoles.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("appRoles.toast.createFailed"))
      )
    },
  })
}

export function useUpdateAppRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: AppRolePayload
    }) => appRolesService.update(id, payload),
    onSuccess: async () => {
      await invalidateAppRoleCaches(queryClient)
      toast.success(i18n.t("appRoles.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("appRoles.toast.updateFailed"))
      )
    },
  })
}

export function useDeleteAppRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => appRolesService.remove(id),
    onSuccess: async () => {
      await invalidateAppRoleCaches(queryClient)
      toast.success(i18n.t("appRoles.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("appRoles.toast.deleteFailed"))
      )
    },
  })
}
