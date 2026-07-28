import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import { usersService } from "@/features/users/services/users-service"
import type { UserPayload } from "@/features/users/types/user"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"
import { lookupsService } from "@/lib/lookups-service"
import type { ListQueryParams } from "@/types/api"

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: ListQueryParams) => [...userKeys.lists(), params] as const,
  statistics: () => [...userKeys.all, "statistics"] as const,
}

export const userLookupKeys = {
  jobTitles: ["lookups", "job-titles"] as const,
}

export function useJobTitlesLookup() {
  return useQuery({
    queryKey: userLookupKeys.jobTitles,
    queryFn: () => lookupsService.jobTitles(),
    staleTime: 60_000,
  })
}

export function useUsers(params: ListQueryParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersService.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UserPayload) => usersService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success(i18n.t("users.toast.created"))
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, i18n.t("users.toast.createFailed")))
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UserPayload }) =>
      usersService.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success(i18n.t("users.toast.updated"))
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, i18n.t("users.toast.updateFailed")))
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => usersService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success(i18n.t("users.toast.deleted"))
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, i18n.t("users.toast.deleteFailed")))
    },
  })
}

export function useUserStatistics() {
  return useQuery({
    queryKey: userKeys.statistics(),
    queryFn: () => usersService.statistics(),
    staleTime: 60_000,
  })
}

