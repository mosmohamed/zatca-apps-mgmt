import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import { applicationsService } from "@/features/applications/services/applications-service"
import type { ApplicationPayload } from "@/features/applications/types/application"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"
import { lookupsService } from "@/lib/lookups-service"
import type { ListQueryParams } from "@/types/api"

export const applicationKeys = {
  all: ["applications"] as const,
  lists: () => [...applicationKeys.all, "list"] as const,
  list: (params: ListQueryParams) =>
    [...applicationKeys.lists(), params] as const,
  details: () => [...applicationKeys.all, "detail"] as const,
  detail: (id: number) => [...applicationKeys.details(), id] as const,
}

export const lookupKeys = {
  departments: ["lookups", "departments"] as const,
  applicationTypes: ["lookups", "application-types"] as const,
  applicationStatuses: ["lookups", "application-statuses"] as const,
  criticalities: ["lookups", "criticalities"] as const,
  supportTypes: ["lookups", "support-types"] as const,
  technologies: ["lookups", "technologies"] as const,
}

export function useApplications(params: ListQueryParams) {
  return useQuery({
    queryKey: applicationKeys.list(params),
    queryFn: () => applicationsService.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useApplication(id: number) {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => applicationsService.get(id),
    enabled: Number.isFinite(id) && id > 0,
  })
}

export function useDepartmentsLookup() {
  return useQuery({
    queryKey: lookupKeys.departments,
    queryFn: () => lookupsService.departments(),
    staleTime: 60_000,
  })
}

export function useApplicationTypesLookup() {
  return useQuery({
    queryKey: lookupKeys.applicationTypes,
    queryFn: () => lookupsService.applicationTypes(),
    staleTime: 60_000,
  })
}

export function useApplicationStatusesLookup() {
  return useQuery({
    queryKey: lookupKeys.applicationStatuses,
    queryFn: () => lookupsService.applicationStatuses(),
    staleTime: 60_000,
  })
}

export function useCriticalitiesLookup() {
  return useQuery({
    queryKey: lookupKeys.criticalities,
    queryFn: () => lookupsService.criticalities(),
    staleTime: 60_000,
  })
}

export function useSupportTypesLookup() {
  return useQuery({
    queryKey: lookupKeys.supportTypes,
    queryFn: () => lookupsService.supportTypes(),
    staleTime: 60_000,
  })
}

export function useTechnologiesLookup() {
  return useQuery({
    queryKey: lookupKeys.technologies,
    queryFn: () => lookupsService.technologies(),
    staleTime: 60_000,
  })
}

export function useCreateApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ApplicationPayload) =>
      applicationsService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: applicationKeys.lists() })
      toast.success(i18n.t("applications.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("applications.toast.createFailed"))
      )
    },
  })
}

export function useUpdateApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: ApplicationPayload
    }) => applicationsService.update(id, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: applicationKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: applicationKeys.detail(variables.id),
        }),
      ])
      toast.success(i18n.t("applications.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("applications.toast.updateFailed"))
      )
    },
  })
}

export function useDeleteApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => applicationsService.remove(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: applicationKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: applicationKeys.detail(id),
        }),
      ])
      toast.success(i18n.t("applications.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("applications.toast.deleteFailed"))
      )
    },
  })
}
