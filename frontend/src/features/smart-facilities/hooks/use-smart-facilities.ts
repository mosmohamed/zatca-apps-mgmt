import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import {
  smartFacilitiesCategoriesService,
  smartFacilitiesLevelsService,
  smartFacilitiesTeamAssignmentsService,
} from "@/features/smart-facilities/services/smart-facilities-service"
import type {
  SmartFacilitiesCategory,
  SmartFacilitiesCategoryListParams,
  SmartFacilitiesCategoryPayload,
  SmartFacilitiesLevel,
  SmartFacilitiesLevelListParams,
  SmartFacilitiesLevelPayload,
  SmartFacilitiesTeamAssignmentListParams,
  SmartFacilitiesTeamAssignmentPayload,
  SmartFacilitiesTeamAssignmentUpdatePayload,
} from "@/features/smart-facilities/types/smart-facilities"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"
import { api } from "@/lib/axios"
import type { ApiEnvelope, ListQueryParams } from "@/types/api"

export const infraLevelKeys = {
  all: ["smart-facilities-levels"] as const,
  lists: () => [...infraLevelKeys.all, "list"] as const,
  list: (params: SmartFacilitiesLevelListParams) =>
    [...infraLevelKeys.lists(), params] as const,
  lookup: ["lookups", "smart-facilities-levels"] as const,
}

export const infraCategoryKeys = {
  all: ["smart-facilities-categories"] as const,
  lists: () => [...infraCategoryKeys.all, "list"] as const,
  list: (params: SmartFacilitiesCategoryListParams) =>
    [...infraCategoryKeys.lists(), params] as const,
  trees: () => [...infraCategoryKeys.all, "tree"] as const,
  tree: (activeOnly: boolean) =>
    [...infraCategoryKeys.trees(), activeOnly] as const,
  lookup: ["lookups", "smart-facilities-categories"] as const,
  statistics: () => [...infraCategoryKeys.all, "statistics"] as const,
}

export const smartFacilitiesTeamAssignmentKeys = {
  all: ["smart-facilities-team-assignments"] as const,
  lists: () => [...smartFacilitiesTeamAssignmentKeys.all, "list"] as const,
  list: (params: SmartFacilitiesTeamAssignmentListParams) =>
    [...smartFacilitiesTeamAssignmentKeys.lists(), params] as const,
  details: () => [...smartFacilitiesTeamAssignmentKeys.all, "details"] as const,
  statistics: () => [...smartFacilitiesTeamAssignmentKeys.all, "statistics"] as const,
  categorySummaries: () =>
    [...smartFacilitiesTeamAssignmentKeys.all, "categories-summary"] as const,
  categorySummary: (params: ListQueryParams) =>
    [...smartFacilitiesTeamAssignmentKeys.categorySummaries(), params] as const,
  categoryMatrix: (id: number) =>
    [...smartFacilitiesTeamAssignmentKeys.all, "category-matrix", id] as const,
}

/* -------------------------------------------------------------------------- */
/* Levels                                                                      */
/* -------------------------------------------------------------------------- */

export function useSmartFacilitiesLevels(params: SmartFacilitiesLevelListParams) {
  return useQuery({
    queryKey: infraLevelKeys.list(params),
    queryFn: () => smartFacilitiesLevelsService.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useSmartFacilitiesLevelsLookup() {
  return useQuery({
    queryKey: infraLevelKeys.lookup,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<SmartFacilitiesLevel[]>>(
        "/lookups/smart-facilities-levels"
      )
      return data.data
    },
    staleTime: 60_000,
  })
}

async function invalidateSmartFacilitiesLevelCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: infraLevelKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: infraLevelKeys.lookup }),
    queryClient.invalidateQueries({ queryKey: smartFacilitiesTeamAssignmentKeys.all }),
  ])
}

export function useCreateSmartFacilitiesLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SmartFacilitiesLevelPayload) =>
      smartFacilitiesLevelsService.create(payload),
    onSuccess: async () => {
      await invalidateSmartFacilitiesLevelCaches(queryClient)
      toast.success(i18n.t("smartFacilities.levels.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("smartFacilities.levels.toast.createFailed")
        )
      )
    },
  })
}

export function useUpdateSmartFacilitiesLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: SmartFacilitiesLevelPayload
    }) => smartFacilitiesLevelsService.update(id, payload),
    onSuccess: async () => {
      await invalidateSmartFacilitiesLevelCaches(queryClient)
      toast.success(i18n.t("smartFacilities.levels.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("smartFacilities.levels.toast.updateFailed")
        )
      )
    },
  })
}

export function useDeleteSmartFacilitiesLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => smartFacilitiesLevelsService.remove(id),
    onSuccess: async () => {
      await invalidateSmartFacilitiesLevelCaches(queryClient)
      toast.success(i18n.t("smartFacilities.levels.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("smartFacilities.levels.toast.deleteFailed")
        )
      )
    },
  })
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                  */
/* -------------------------------------------------------------------------- */

export function useSmartFacilitiesCategories(params: SmartFacilitiesCategoryListParams) {
  return useQuery({
    queryKey: infraCategoryKeys.list(params),
    queryFn: () => smartFacilitiesCategoriesService.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useSmartFacilitiesCategoryStatistics() {
  return useQuery({
    queryKey: infraCategoryKeys.statistics(),
    queryFn: () => smartFacilitiesCategoriesService.statistics(),
  })
}

export function useSmartFacilitiesCategoryTree(activeOnly = false) {
  return useQuery({
    queryKey: infraCategoryKeys.tree(activeOnly),
    queryFn: () => smartFacilitiesCategoriesService.tree(activeOnly),
    placeholderData: (previous) => previous,
  })
}

export function useSmartFacilitiesCategoriesLookup() {
  return useQuery({
    queryKey: infraCategoryKeys.lookup,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<SmartFacilitiesCategory[]>>(
        "/lookups/smart-facilities-categories"
      )
      return data.data
    },
    staleTime: 60_000,
  })
}

async function invalidateSmartFacilitiesCategoryCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: infraCategoryKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: infraCategoryKeys.trees() }),
    queryClient.invalidateQueries({ queryKey: infraCategoryKeys.lookup }),
    queryClient.invalidateQueries({ queryKey: smartFacilitiesTeamAssignmentKeys.all }),
  ])
}

export function useCreateSmartFacilitiesCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SmartFacilitiesCategoryPayload) =>
      smartFacilitiesCategoriesService.create(payload),
    onSuccess: async () => {
      await invalidateSmartFacilitiesCategoryCaches(queryClient)
      toast.success(i18n.t("smartFacilities.categories.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("smartFacilities.categories.toast.createFailed")
        )
      )
    },
  })
}

export function useUpdateSmartFacilitiesCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: SmartFacilitiesCategoryPayload
    }) => smartFacilitiesCategoriesService.update(id, payload),
    onSuccess: async () => {
      await invalidateSmartFacilitiesCategoryCaches(queryClient)
      toast.success(i18n.t("smartFacilities.categories.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("smartFacilities.categories.toast.updateFailed")
        )
      )
    },
  })
}

export function useDeleteSmartFacilitiesCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => smartFacilitiesCategoriesService.remove(id),
    onSuccess: async () => {
      await invalidateSmartFacilitiesCategoryCaches(queryClient)
      toast.success(i18n.t("smartFacilities.categories.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("smartFacilities.categories.toast.deleteFailed")
        )
      )
    },
  })
}

/* -------------------------------------------------------------------------- */
/* Team assignments                                                            */
/* -------------------------------------------------------------------------- */

export function useSmartFacilitiesTeamAssignments(params: SmartFacilitiesTeamAssignmentListParams) {
  return useQuery({
    queryKey: smartFacilitiesTeamAssignmentKeys.list(params),
    queryFn: () => smartFacilitiesTeamAssignmentsService.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useSmartFacilitiesTeamAssignmentStatistics() {
  return useQuery({
    queryKey: smartFacilitiesTeamAssignmentKeys.statistics(),
    queryFn: () => smartFacilitiesTeamAssignmentsService.statistics(),
  })
}

export function useSmartFacilitiesCategoryAssignmentsSummary(params: ListQueryParams) {
  return useQuery({
    queryKey: smartFacilitiesTeamAssignmentKeys.categorySummary(params),
    queryFn: () => smartFacilitiesTeamAssignmentsService.categoriesSummary(params),
    placeholderData: (previous) => previous,
  })
}

export function useSmartFacilitiesCategoryAssignmentMatrix(
  categoryId: number | null,
  enabled = true
) {
  return useQuery({
    queryKey: smartFacilitiesTeamAssignmentKeys.categoryMatrix(categoryId ?? 0),
    queryFn: () =>
      smartFacilitiesTeamAssignmentsService.categoryMatrix(categoryId as number),
    enabled: enabled && categoryId !== null && categoryId > 0,
  })
}

export function useSmartFacilitiesTeamsDetails() {
  return useQuery({
    queryKey: smartFacilitiesTeamAssignmentKeys.details(),
    queryFn: () => smartFacilitiesTeamAssignmentsService.details(),
    placeholderData: (previous) => previous,
  })
}

async function invalidateSmartFacilitiesTeamAssignmentCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await queryClient.invalidateQueries({
    queryKey: smartFacilitiesTeamAssignmentKeys.all,
  })
}

export function useSaveSmartFacilitiesCategoryAssignmentMatrix() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      categoryId,
      existingUpdates,
      newUsers,
      removedIds,
    }: {
      categoryId: number
      existingUpdates: Array<{ id: number; smart_facilities_level_id: number }>
      newUsers: Array<{ user_id: number; smart_facilities_level_id: number }>
      removedIds: number[]
    }) => {
      for (const id of removedIds) {
        await smartFacilitiesTeamAssignmentsService.remove(id)
      }

      for (const update of existingUpdates) {
        await smartFacilitiesTeamAssignmentsService.update(update.id, {
          smart_facilities_level_id: update.smart_facilities_level_id,
        })
      }

      if (newUsers.length > 0) {
        await smartFacilitiesTeamAssignmentsService.create({
          smart_facilities_category_id: categoryId,
          users: newUsers,
        })
      }
    },
    onSuccess: async () => {
      await invalidateSmartFacilitiesTeamAssignmentCaches(queryClient)
      toast.success(i18n.t("smartFacilities.assignments.toast.matrixSaved"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("smartFacilities.assignments.toast.updateFailed")
        )
      )
    },
  })
}

export function useCreateSmartFacilitiesTeamAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SmartFacilitiesTeamAssignmentPayload) =>
      smartFacilitiesTeamAssignmentsService.create(payload),
    onSuccess: async () => {
      await invalidateSmartFacilitiesTeamAssignmentCaches(queryClient)
      toast.success(i18n.t("smartFacilities.assignments.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("smartFacilities.assignments.toast.createFailed")
        )
      )
    },
  })
}

export function useUpdateSmartFacilitiesTeamAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: SmartFacilitiesTeamAssignmentUpdatePayload
    }) => smartFacilitiesTeamAssignmentsService.update(id, payload),
    onSuccess: async () => {
      await invalidateSmartFacilitiesTeamAssignmentCaches(queryClient)
      toast.success(i18n.t("smartFacilities.assignments.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("smartFacilities.assignments.toast.updateFailed")
        )
      )
    },
  })
}

export function useDeleteSmartFacilitiesTeamAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => smartFacilitiesTeamAssignmentsService.remove(id),
    onSuccess: async () => {
      await invalidateSmartFacilitiesTeamAssignmentCaches(queryClient)
      toast.success(i18n.t("smartFacilities.assignments.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("smartFacilities.assignments.toast.deleteFailed")
        )
      )
    },
  })
}
