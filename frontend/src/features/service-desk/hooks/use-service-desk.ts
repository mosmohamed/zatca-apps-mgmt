import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import {
  serviceDeskCategoriesService,
  serviceDeskLevelsService,
  serviceDeskTeamAssignmentsService,
} from "@/features/service-desk/services/service-desk-service"
import type {
  ServiceDeskCategory,
  ServiceDeskCategoryListParams,
  ServiceDeskCategoryPayload,
  ServiceDeskLevel,
  ServiceDeskLevelListParams,
  ServiceDeskLevelPayload,
  ServiceDeskTeamAssignmentListParams,
  ServiceDeskTeamAssignmentPayload,
  ServiceDeskTeamAssignmentUpdatePayload,
} from "@/features/service-desk/types/service-desk"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"
import { api } from "@/lib/axios"
import type { ApiEnvelope, ListQueryParams } from "@/types/api"

export const infraLevelKeys = {
  all: ["service-desk-levels"] as const,
  lists: () => [...infraLevelKeys.all, "list"] as const,
  list: (params: ServiceDeskLevelListParams) =>
    [...infraLevelKeys.lists(), params] as const,
  lookup: ["lookups", "service-desk-levels"] as const,
}

export const infraCategoryKeys = {
  all: ["service-desk-categories"] as const,
  lists: () => [...infraCategoryKeys.all, "list"] as const,
  list: (params: ServiceDeskCategoryListParams) =>
    [...infraCategoryKeys.lists(), params] as const,
  trees: () => [...infraCategoryKeys.all, "tree"] as const,
  tree: (activeOnly: boolean) =>
    [...infraCategoryKeys.trees(), activeOnly] as const,
  lookup: ["lookups", "service-desk-categories"] as const,
  statistics: () => [...infraCategoryKeys.all, "statistics"] as const,
}

export const serviceDeskTeamAssignmentKeys = {
  all: ["service-desk-team-assignments"] as const,
  lists: () => [...serviceDeskTeamAssignmentKeys.all, "list"] as const,
  list: (params: ServiceDeskTeamAssignmentListParams) =>
    [...serviceDeskTeamAssignmentKeys.lists(), params] as const,
  details: () => [...serviceDeskTeamAssignmentKeys.all, "details"] as const,
  statistics: () => [...serviceDeskTeamAssignmentKeys.all, "statistics"] as const,
  categorySummaries: () =>
    [...serviceDeskTeamAssignmentKeys.all, "categories-summary"] as const,
  categorySummary: (params: ListQueryParams) =>
    [...serviceDeskTeamAssignmentKeys.categorySummaries(), params] as const,
  categoryMatrix: (id: number) =>
    [...serviceDeskTeamAssignmentKeys.all, "category-matrix", id] as const,
}

/* -------------------------------------------------------------------------- */
/* Levels                                                                      */
/* -------------------------------------------------------------------------- */

export function useServiceDeskLevels(params: ServiceDeskLevelListParams) {
  return useQuery({
    queryKey: infraLevelKeys.list(params),
    queryFn: () => serviceDeskLevelsService.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useServiceDeskLevelsLookup() {
  return useQuery({
    queryKey: infraLevelKeys.lookup,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<ServiceDeskLevel[]>>(
        "/lookups/service-desk-levels"
      )
      return data.data
    },
    staleTime: 60_000,
  })
}

async function invalidateServiceDeskLevelCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: infraLevelKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: infraLevelKeys.lookup }),
    queryClient.invalidateQueries({ queryKey: serviceDeskTeamAssignmentKeys.all }),
  ])
}

export function useCreateServiceDeskLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ServiceDeskLevelPayload) =>
      serviceDeskLevelsService.create(payload),
    onSuccess: async () => {
      await invalidateServiceDeskLevelCaches(queryClient)
      toast.success(i18n.t("serviceDesk.levels.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("serviceDesk.levels.toast.createFailed")
        )
      )
    },
  })
}

export function useUpdateServiceDeskLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: ServiceDeskLevelPayload
    }) => serviceDeskLevelsService.update(id, payload),
    onSuccess: async () => {
      await invalidateServiceDeskLevelCaches(queryClient)
      toast.success(i18n.t("serviceDesk.levels.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("serviceDesk.levels.toast.updateFailed")
        )
      )
    },
  })
}

export function useDeleteServiceDeskLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => serviceDeskLevelsService.remove(id),
    onSuccess: async () => {
      await invalidateServiceDeskLevelCaches(queryClient)
      toast.success(i18n.t("serviceDesk.levels.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("serviceDesk.levels.toast.deleteFailed")
        )
      )
    },
  })
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                  */
/* -------------------------------------------------------------------------- */

export function useServiceDeskCategories(params: ServiceDeskCategoryListParams) {
  return useQuery({
    queryKey: infraCategoryKeys.list(params),
    queryFn: () => serviceDeskCategoriesService.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useServiceDeskCategoryStatistics() {
  return useQuery({
    queryKey: infraCategoryKeys.statistics(),
    queryFn: () => serviceDeskCategoriesService.statistics(),
  })
}

export function useServiceDeskCategoryTree(activeOnly = false) {
  return useQuery({
    queryKey: infraCategoryKeys.tree(activeOnly),
    queryFn: () => serviceDeskCategoriesService.tree(activeOnly),
    placeholderData: (previous) => previous,
  })
}

export function useServiceDeskCategoriesLookup() {
  return useQuery({
    queryKey: infraCategoryKeys.lookup,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<ServiceDeskCategory[]>>(
        "/lookups/service-desk-categories"
      )
      return data.data
    },
    staleTime: 60_000,
  })
}

async function invalidateServiceDeskCategoryCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: infraCategoryKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: infraCategoryKeys.trees() }),
    queryClient.invalidateQueries({ queryKey: infraCategoryKeys.lookup }),
    queryClient.invalidateQueries({ queryKey: serviceDeskTeamAssignmentKeys.all }),
  ])
}

export function useCreateServiceDeskCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ServiceDeskCategoryPayload) =>
      serviceDeskCategoriesService.create(payload),
    onSuccess: async () => {
      await invalidateServiceDeskCategoryCaches(queryClient)
      toast.success(i18n.t("serviceDesk.categories.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("serviceDesk.categories.toast.createFailed")
        )
      )
    },
  })
}

export function useUpdateServiceDeskCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: ServiceDeskCategoryPayload
    }) => serviceDeskCategoriesService.update(id, payload),
    onSuccess: async () => {
      await invalidateServiceDeskCategoryCaches(queryClient)
      toast.success(i18n.t("serviceDesk.categories.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("serviceDesk.categories.toast.updateFailed")
        )
      )
    },
  })
}

export function useDeleteServiceDeskCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => serviceDeskCategoriesService.remove(id),
    onSuccess: async () => {
      await invalidateServiceDeskCategoryCaches(queryClient)
      toast.success(i18n.t("serviceDesk.categories.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("serviceDesk.categories.toast.deleteFailed")
        )
      )
    },
  })
}

/* -------------------------------------------------------------------------- */
/* Team assignments                                                            */
/* -------------------------------------------------------------------------- */

export function useServiceDeskTeamAssignments(params: ServiceDeskTeamAssignmentListParams) {
  return useQuery({
    queryKey: serviceDeskTeamAssignmentKeys.list(params),
    queryFn: () => serviceDeskTeamAssignmentsService.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useServiceDeskTeamAssignmentStatistics() {
  return useQuery({
    queryKey: serviceDeskTeamAssignmentKeys.statistics(),
    queryFn: () => serviceDeskTeamAssignmentsService.statistics(),
  })
}

export function useServiceDeskCategoryAssignmentsSummary(params: ListQueryParams) {
  return useQuery({
    queryKey: serviceDeskTeamAssignmentKeys.categorySummary(params),
    queryFn: () => serviceDeskTeamAssignmentsService.categoriesSummary(params),
    placeholderData: (previous) => previous,
  })
}

export function useServiceDeskCategoryAssignmentMatrix(
  categoryId: number | null,
  enabled = true
) {
  return useQuery({
    queryKey: serviceDeskTeamAssignmentKeys.categoryMatrix(categoryId ?? 0),
    queryFn: () =>
      serviceDeskTeamAssignmentsService.categoryMatrix(categoryId as number),
    enabled: enabled && categoryId !== null && categoryId > 0,
  })
}

export function useServiceDeskTeamsDetails() {
  return useQuery({
    queryKey: serviceDeskTeamAssignmentKeys.details(),
    queryFn: () => serviceDeskTeamAssignmentsService.details(),
    placeholderData: (previous) => previous,
  })
}

async function invalidateServiceDeskTeamAssignmentCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await queryClient.invalidateQueries({
    queryKey: serviceDeskTeamAssignmentKeys.all,
  })
}

export function useSaveServiceDeskCategoryAssignmentMatrix() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      categoryId,
      existingUpdates,
      newUsers,
      removedIds,
    }: {
      categoryId: number
      existingUpdates: Array<{ id: number; service_desk_level_id: number }>
      newUsers: Array<{ user_id: number; service_desk_level_id: number }>
      removedIds: number[]
    }) => {
      for (const id of removedIds) {
        await serviceDeskTeamAssignmentsService.remove(id)
      }

      for (const update of existingUpdates) {
        await serviceDeskTeamAssignmentsService.update(update.id, {
          service_desk_level_id: update.service_desk_level_id,
        })
      }

      if (newUsers.length > 0) {
        await serviceDeskTeamAssignmentsService.create({
          service_desk_category_id: categoryId,
          users: newUsers,
        })
      }
    },
    onSuccess: async () => {
      await invalidateServiceDeskTeamAssignmentCaches(queryClient)
      toast.success(i18n.t("serviceDesk.assignments.toast.matrixSaved"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("serviceDesk.assignments.toast.updateFailed")
        )
      )
    },
  })
}

export function useCreateServiceDeskTeamAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ServiceDeskTeamAssignmentPayload) =>
      serviceDeskTeamAssignmentsService.create(payload),
    onSuccess: async () => {
      await invalidateServiceDeskTeamAssignmentCaches(queryClient)
      toast.success(i18n.t("serviceDesk.assignments.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("serviceDesk.assignments.toast.createFailed")
        )
      )
    },
  })
}

export function useUpdateServiceDeskTeamAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: ServiceDeskTeamAssignmentUpdatePayload
    }) => serviceDeskTeamAssignmentsService.update(id, payload),
    onSuccess: async () => {
      await invalidateServiceDeskTeamAssignmentCaches(queryClient)
      toast.success(i18n.t("serviceDesk.assignments.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("serviceDesk.assignments.toast.updateFailed")
        )
      )
    },
  })
}

export function useDeleteServiceDeskTeamAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => serviceDeskTeamAssignmentsService.remove(id),
    onSuccess: async () => {
      await invalidateServiceDeskTeamAssignmentCaches(queryClient)
      toast.success(i18n.t("serviceDesk.assignments.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("serviceDesk.assignments.toast.deleteFailed")
        )
      )
    },
  })
}
