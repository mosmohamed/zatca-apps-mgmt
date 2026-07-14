import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { rolesService } from "@/features/roles/services/roles-service"
import type {
  RolePayload,
  SyncRolePermissionsPayload,
} from "@/features/roles/types/role"
import { userKeys } from "@/features/users/hooks/use-users"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"
import type { ListQueryParams } from "@/types/api"

export const roleKeys = {
  all: ["roles"] as const,
  list: () => [...roleKeys.all, "list"] as const,
  permissions: () => [...roleKeys.all, "permissions"] as const,
  users: (roleId: number, params: ListQueryParams) =>
    [...roleKeys.all, "users", roleId, params] as const,
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

export function useRoleUsers(roleId: number, params: ListQueryParams = {}) {
  return useQuery({
    queryKey: roleKeys.users(roleId, params),
    queryFn: () => rolesService.listUsers(roleId, params),
    enabled: roleId > 0,
  })
}

export function useAttachRoleUser(roleId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: number) => rolesService.attachUser(roleId, userId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: roleKeys.all }),
        queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
      ])
      toast.success(i18n.t("roles.toast.userAttached"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("roles.toast.userAttachFailed"))
      )
    },
  })
}

export function useDetachRoleUser(roleId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: number) => rolesService.detachUser(roleId, userId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: roleKeys.all }),
        queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
      ])
      toast.success(i18n.t("roles.toast.userDetached"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("roles.toast.userDetachFailed"))
      )
    },
  })
}
