import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import { vendorsService } from "@/features/vendors/services/vendors-service"
import type { VendorPayload } from "@/features/vendors/types/vendor"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"
import type { ListQueryParams } from "@/types/api"

export const vendorKeys = {
  all: ["vendors"] as const,
  lists: () => [...vendorKeys.all, "list"] as const,
  list: (params: ListQueryParams) => [...vendorKeys.lists(), params] as const,
  statistics: () => [...vendorKeys.all, "statistics"] as const,
}

export function useVendors(params: ListQueryParams) {
  return useQuery({
    queryKey: vendorKeys.list(params),
    queryFn: () => vendorsService.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useCreateVendor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: VendorPayload) => vendorsService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: vendorKeys.lists() })
      toast.success(i18n.t("vendors.toast.created"))
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, i18n.t("vendors.toast.createFailed")))
    },
  })
}

export function useUpdateVendor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: VendorPayload }) =>
      vendorsService.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: vendorKeys.lists() })
      toast.success(i18n.t("vendors.toast.updated"))
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, i18n.t("vendors.toast.updateFailed")))
    },
  })
}

export function useDeleteVendor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => vendorsService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: vendorKeys.lists() })
      toast.success(i18n.t("vendors.toast.deleted"))
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, i18n.t("vendors.toast.deleteFailed")))
    },
  })
}

export function useVendorStatistics() {
  return useQuery({
    queryKey: vendorKeys.statistics(),
    queryFn: () => vendorsService.statistics(),
    staleTime: 60_000,
  })
}

