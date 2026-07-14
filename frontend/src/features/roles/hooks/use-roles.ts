import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { rolesService } from "@/features/roles/services/roles-service"
import type {
  RolePayload,
  SyncRolePermissionsPayload,
} from "@/features/roles/types/role"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"

export const roleKeys = {
  all: ["roles"] as const,
  list: () => [...roleKeys.all, "list"] as const,
  permissions: () => [...roleKeys.all, "permissions"] as const,
}

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: () => rolesService.list(),
  })
}

export function usePermissionsCatalog() {
  return useQuery({
    queryKey: roleKeys.permissions(),
    queryFn: () => rolesService.permissions(),
    staleTime: 60_000,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: RolePayload) => rolesService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roleKeys.list() })
      toast.success(i18n.t("roles.toast.created"))
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, i18n.t("roles.toast.createFailed")))
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RolePayload }) =>
      rolesService.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roleKeys.list() })
      toast.success(i18n.t("roles.toast.updated"))
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, i18n.t("roles.toast.updateFailed")))
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => rolesService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roleKeys.list() })
      toast.success(i18n.t("roles.toast.deleted"))
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, i18n.t("roles.toast.deleteFailed")))
    },
  })
}

export function useSyncRolePermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: SyncRolePermissionsPayload
    }) => rolesService.syncPermissions(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roleKeys.list() })
      toast.success(i18n.t("roles.toast.permissionsSaved"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("roles.toast.permissionsSaveFailed"))
      )
    },
  })
}
