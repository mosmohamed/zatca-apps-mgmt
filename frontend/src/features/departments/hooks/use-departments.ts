import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import { departmentsService } from "@/features/departments/services/departments-service"
import type { DepartmentPayload } from "@/features/departments/types/department"
import { lookupKeys } from "@/features/applications/hooks/use-applications"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"
import type { ListQueryParams } from "@/types/api"

export const departmentKeys = {
  all: ["departments"] as const,
  lists: () => [...departmentKeys.all, "list"] as const,
  list: (params: ListQueryParams) =>
    [...departmentKeys.lists(), params] as const,
}

export function useDepartments(params: ListQueryParams) {
  return useQuery({
    queryKey: departmentKeys.list(params),
    queryFn: () => departmentsService.list(params),
    placeholderData: (previous) => previous,
  })
}

async function invalidateDepartmentCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: departmentKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: lookupKeys.departments }),
  ])
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: DepartmentPayload) =>
      departmentsService.create(payload),
    onSuccess: async () => {
      await invalidateDepartmentCaches(queryClient)
      toast.success(i18n.t("departments.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("departments.toast.createFailed"))
      )
    },
  })
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: DepartmentPayload
    }) => departmentsService.update(id, payload),
    onSuccess: async () => {
      await invalidateDepartmentCaches(queryClient)
      toast.success(i18n.t("departments.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("departments.toast.updateFailed"))
      )
    },
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => departmentsService.remove(id),
    onSuccess: async () => {
      await invalidateDepartmentCaches(queryClient)
      toast.success(i18n.t("departments.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("departments.toast.deleteFailed"))
      )
    },
  })
}
