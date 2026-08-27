import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import { dashboardKeys } from "@/features/dashboard/hooks/use-dashboard"
import {
  LICENSE_MODULES,
  type LicenseModuleId,
} from "@/features/licenses/config/license-modules"
import { getLicensesService } from "@/features/licenses/services/licenses-service"
import type {
  LicenseListQueryParams,
  LicensePayload,
} from "@/features/licenses/types/license"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"

export function licenseKeysFor(moduleId: LicenseModuleId) {
  const root = LICENSE_MODULES[moduleId].queryKey
  return {
    all: [root] as const,
    lists: () => [root, "list"] as const,
    list: (params: LicenseListQueryParams) =>
      [root, "list", params] as const,
    details: () => [root, "detail"] as const,
    detail: (id: number) => [root, "detail", id] as const,
    statistics: () => [root, "statistics"] as const,
  }
}

/** @deprecated Use licenseKeysFor("apps") */
export const licenseKeys = licenseKeysFor("apps")

async function invalidateLicenseCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  moduleId: LicenseModuleId
) {
  const keys = licenseKeysFor(moduleId)
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: keys.lists() }),
    queryClient.invalidateQueries({ queryKey: keys.details() }),
    queryClient.invalidateQueries({ queryKey: keys.statistics() }),
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
  ])
}

function serviceFor(moduleId: LicenseModuleId) {
  return getLicensesService(LICENSE_MODULES[moduleId].apiBase)
}

export function useLicenses(
  params: LicenseListQueryParams,
  moduleId: LicenseModuleId = "apps"
) {
  const keys = licenseKeysFor(moduleId)
  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => serviceFor(moduleId).list(params),
    placeholderData: (previous) => previous,
  })
}

export function useLicense(
  id: number,
  moduleId: LicenseModuleId = "apps"
) {
  const keys = licenseKeysFor(moduleId)
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => serviceFor(moduleId).get(id),
    enabled: Number.isFinite(id) && id > 0,
  })
}

export function useLicenseStatistics(moduleId: LicenseModuleId = "apps") {
  const keys = licenseKeysFor(moduleId)
  return useQuery({
    queryKey: keys.statistics(),
    queryFn: () => serviceFor(moduleId).statistics(),
    staleTime: 60_000,
  })
}

export function useCreateLicense(moduleId: LicenseModuleId = "apps") {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LicensePayload) =>
      serviceFor(moduleId).create(payload),
    onSuccess: async () => {
      await invalidateLicenseCaches(queryClient, moduleId)
      toast.success(i18n.t("licenses.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("licenses.toast.createFailed"))
      )
    },
  })
}

export function useUpdateLicense(moduleId: LicenseModuleId = "apps") {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: LicensePayload
    }) => serviceFor(moduleId).update(id, payload),
    onSuccess: async () => {
      await invalidateLicenseCaches(queryClient, moduleId)
      toast.success(i18n.t("licenses.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("licenses.toast.updateFailed"))
      )
    },
  })
}

export function useDeleteLicense(moduleId: LicenseModuleId = "apps") {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => serviceFor(moduleId).remove(id),
    onSuccess: async () => {
      await invalidateLicenseCaches(queryClient, moduleId)
      toast.success(i18n.t("licenses.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("licenses.toast.deleteFailed"))
      )
    },
  })
}
