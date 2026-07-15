import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import { dashboardKeys } from "@/features/dashboard/hooks/use-dashboard"
import { licensesService } from "@/features/licenses/services/licenses-service"
import type {
  LicenseListQueryParams,
  LicensePayload,
} from "@/features/licenses/types/license"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"

export const licenseKeys = {
  all: ["licenses"] as const,
  lists: () => [...licenseKeys.all, "list"] as const,
  list: (params: LicenseListQueryParams) =>
    [...licenseKeys.lists(), params] as const,
  details: () => [...licenseKeys.all, "detail"] as const,
  detail: (id: number) => [...licenseKeys.details(), id] as const,
  statistics: () => [...licenseKeys.all, "statistics"] as const,
}

async function invalidateLicenseCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: licenseKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: licenseKeys.details() }),
    queryClient.invalidateQueries({ queryKey: licenseKeys.statistics() }),
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
  ])
}

export function useLicenses(params: LicenseListQueryParams) {
  return useQuery({
    queryKey: licenseKeys.list(params),
    queryFn: () => licensesService.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useLicense(id: number) {
  return useQuery({
    queryKey: licenseKeys.detail(id),
    queryFn: () => licensesService.get(id),
    enabled: Number.isFinite(id) && id > 0,
  })
}

export function useLicenseStatistics() {
  return useQuery({
    queryKey: licenseKeys.statistics(),
    queryFn: () => licensesService.statistics(),
    staleTime: 60_000,
  })
}

export function useCreateLicense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LicensePayload) => licensesService.create(payload),
    onSuccess: async () => {
      await invalidateLicenseCaches(queryClient)
      toast.success(i18n.t("licenses.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("licenses.toast.createFailed"))
      )
    },
  })
}

export function useUpdateLicense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: LicensePayload
    }) => licensesService.update(id, payload),
    onSuccess: async () => {
      await invalidateLicenseCaches(queryClient)
      toast.success(i18n.t("licenses.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("licenses.toast.updateFailed"))
      )
    },
  })
}

export function useDeleteLicense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => licensesService.remove(id),
    onSuccess: async () => {
      await invalidateLicenseCaches(queryClient)
      toast.success(i18n.t("licenses.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("licenses.toast.deleteFailed"))
      )
    },
  })
}
