import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import {
  releaseManagementCategoriesService,
  releaseManagementLevelsService,
  releaseManagementTeamAssignmentsService,
} from "@/features/release-management/services/release-management-service"
import type {
  ReleaseManagementCategory,
  ReleaseManagementCategoryListParams,
  ReleaseManagementCategoryPayload,
  ReleaseManagementLevel,
  ReleaseManagementLevelListParams,
  ReleaseManagementLevelPayload,
  ReleaseManagementTeamAssignmentListParams,
  ReleaseManagementTeamAssignmentPayload,
  ReleaseManagementTeamAssignmentUpdatePayload,
} from "@/features/release-management/types/release-management"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"
import { api } from "@/lib/axios"
import type { ApiEnvelope, ListQueryParams } from "@/types/api"

export const infraLevelKeys = {
  all: ["release-management-levels"] as const,
  lists: () => [...infraLevelKeys.all, "list"] as const,
  list: (params: ReleaseManagementLevelListParams) =>
    [...infraLevelKeys.lists(), params] as const,
  lookup: ["lookups", "release-management-levels"] as const,
}

export const infraCategoryKeys = {
  all: ["release-management-categories"] as const,
  lists: () => [...infraCategoryKeys.all, "list"] as const,
  list: (params: ReleaseManagementCategoryListParams) =>
    [...infraCategoryKeys.lists(), params] as const,
  trees: () => [...infraCategoryKeys.all, "tree"] as const,
  tree: (activeOnly: boolean) =>
    [...infraCategoryKeys.trees(), activeOnly] as const,
  lookup: ["lookups", "release-management-categories"] as const,
  statistics: () => [...infraCategoryKeys.all, "statistics"] as const,
}

export const releaseManagementTeamAssignmentKeys = {
  all: ["release-management-team-assignments"] as const,
  lists: () => [...releaseManagementTeamAssignmentKeys.all, "list"] as const,
  list: (params: ReleaseManagementTeamAssignmentListParams) =>
    [...releaseManagementTeamAssignmentKeys.lists(), params] as const,
  details: () => [...releaseManagementTeamAssignmentKeys.all, "details"] as const,
  statistics: () => [...releaseManagementTeamAssignmentKeys.all, "statistics"] as const,
  categorySummaries: () =>
    [...releaseManagementTeamAssignmentKeys.all, "categories-summary"] as const,
  categorySummary: (params: ListQueryParams) =>
    [...releaseManagementTeamAssignmentKeys.categorySummaries(), params] as const,
  categoryMatrix: (id: number) =>
    [...releaseManagementTeamAssignmentKeys.all, "category-matrix", id] as const,
}

/* -------------------------------------------------------------------------- */
/* Levels                                                                      */
/* -------------------------------------------------------------------------- */

export function useReleaseManagementLevels(params: ReleaseManagementLevelListParams) {
  return useQuery({
    queryKey: infraLevelKeys.list(params),
    queryFn: () => releaseManagementLevelsService.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useReleaseManagementLevelsLookup() {
  return useQuery({
    queryKey: infraLevelKeys.lookup,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<ReleaseManagementLevel[]>>(
        "/lookups/release-management-levels"
      )
      return data.data
    },
    staleTime: 60_000,
  })
}

async function invalidateReleaseManagementLevelCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: infraLevelKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: infraLevelKeys.lookup }),
    queryClient.invalidateQueries({ queryKey: releaseManagementTeamAssignmentKeys.all }),
  ])
}

export function useCreateReleaseManagementLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ReleaseManagementLevelPayload) =>
      releaseManagementLevelsService.create(payload),
    onSuccess: async () => {
      await invalidateReleaseManagementLevelCaches(queryClient)
      toast.success(i18n.t("releaseManagement.levels.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("releaseManagement.levels.toast.createFailed")
        )
      )
    },
  })
}

export function useUpdateReleaseManagementLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: ReleaseManagementLevelPayload
    }) => releaseManagementLevelsService.update(id, payload),
    onSuccess: async () => {
      await invalidateReleaseManagementLevelCaches(queryClient)
      toast.success(i18n.t("releaseManagement.levels.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("releaseManagement.levels.toast.updateFailed")
        )
      )
    },
  })
}

export function useDeleteReleaseManagementLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => releaseManagementLevelsService.remove(id),
    onSuccess: async () => {
      await invalidateReleaseManagementLevelCaches(queryClient)
      toast.success(i18n.t("releaseManagement.levels.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("releaseManagement.levels.toast.deleteFailed")
        )
      )
    },
  })
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                  */
/* -------------------------------------------------------------------------- */

export function useReleaseManagementCategories(params: ReleaseManagementCategoryListParams) {
  return useQuery({
    queryKey: infraCategoryKeys.list(params),
    queryFn: () => releaseManagementCategoriesService.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useReleaseManagementCategoryStatistics() {
  return useQuery({
    queryKey: infraCategoryKeys.statistics(),
    queryFn: () => releaseManagementCategoriesService.statistics(),
  })
}

export function useReleaseManagementCategoryTree(activeOnly = false) {
  return useQuery({
    queryKey: infraCategoryKeys.tree(activeOnly),
    queryFn: () => releaseManagementCategoriesService.tree(activeOnly),
    placeholderData: (previous) => previous,
  })
}

export function useReleaseManagementCategoriesLookup() {
  return useQuery({
    queryKey: infraCategoryKeys.lookup,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<ReleaseManagementCategory[]>>(
        "/lookups/release-management-categories"
      )
      return data.data
    },
    staleTime: 60_000,
  })
}

async function invalidateReleaseManagementCategoryCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: infraCategoryKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: infraCategoryKeys.trees() }),
    queryClient.invalidateQueries({ queryKey: infraCategoryKeys.lookup }),
    queryClient.invalidateQueries({ queryKey: releaseManagementTeamAssignmentKeys.all }),
  ])
}

export function useCreateReleaseManagementCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ReleaseManagementCategoryPayload) =>
      releaseManagementCategoriesService.create(payload),
    onSuccess: async () => {
      await invalidateReleaseManagementCategoryCaches(queryClient)
      toast.success(i18n.t("releaseManagement.categories.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("releaseManagement.categories.toast.createFailed")
        )
      )
    },
  })
}

export function useUpdateReleaseManagementCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: ReleaseManagementCategoryPayload
    }) => releaseManagementCategoriesService.update(id, payload),
    onSuccess: async () => {
      await invalidateReleaseManagementCategoryCaches(queryClient)
      toast.success(i18n.t("releaseManagement.categories.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("releaseManagement.categories.toast.updateFailed")
        )
      )
    },
  })
}

export function useDeleteReleaseManagementCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => releaseManagementCategoriesService.remove(id),
    onSuccess: async () => {
      await invalidateReleaseManagementCategoryCaches(queryClient)
      toast.success(i18n.t("releaseManagement.categories.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("releaseManagement.categories.toast.deleteFailed")
        )
      )
    },
  })
}

/* -------------------------------------------------------------------------- */
/* Team assignments                                                            */
/* -------------------------------------------------------------------------- */

export function useReleaseManagementTeamAssignments(params: ReleaseManagementTeamAssignmentListParams) {
  return useQuery({
    queryKey: releaseManagementTeamAssignmentKeys.list(params),
    queryFn: () => releaseManagementTeamAssignmentsService.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useReleaseManagementTeamAssignmentStatistics() {
  return useQuery({
    queryKey: releaseManagementTeamAssignmentKeys.statistics(),
    queryFn: () => releaseManagementTeamAssignmentsService.statistics(),
  })
}

export function useReleaseManagementCategoryAssignmentsSummary(params: ListQueryParams) {
  return useQuery({
    queryKey: releaseManagementTeamAssignmentKeys.categorySummary(params),
    queryFn: () => releaseManagementTeamAssignmentsService.categoriesSummary(params),
    placeholderData: (previous) => previous,
  })
}

export function useReleaseManagementCategoryAssignmentMatrix(
  categoryId: number | null,
  enabled = true
) {
  return useQuery({
    queryKey: releaseManagementTeamAssignmentKeys.categoryMatrix(categoryId ?? 0),
    queryFn: () =>
      releaseManagementTeamAssignmentsService.categoryMatrix(categoryId as number),
    enabled: enabled && categoryId !== null && categoryId > 0,
  })
}

export function useReleaseManagementTeamsDetails() {
  return useQuery({
    queryKey: releaseManagementTeamAssignmentKeys.details(),
    queryFn: () => releaseManagementTeamAssignmentsService.details(),
    placeholderData: (previous) => previous,
  })
}

async function invalidateReleaseManagementTeamAssignmentCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await queryClient.invalidateQueries({
    queryKey: releaseManagementTeamAssignmentKeys.all,
  })
}

export function useSaveReleaseManagementCategoryAssignmentMatrix() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      categoryId,
      existingUpdates,
      newUsers,
      removedIds,
    }: {
      categoryId: number
      existingUpdates: Array<{ id: number; release_management_level_id: number }>
      newUsers: Array<{ user_id: number; release_management_level_id: number }>
      removedIds: number[]
    }) => {
      for (const id of removedIds) {
        await releaseManagementTeamAssignmentsService.remove(id)
      }

      for (const update of existingUpdates) {
        await releaseManagementTeamAssignmentsService.update(update.id, {
          release_management_level_id: update.release_management_level_id,
        })
      }

      if (newUsers.length > 0) {
        await releaseManagementTeamAssignmentsService.create({
          release_management_category_id: categoryId,
          users: newUsers,
        })
      }
    },
    onSuccess: async () => {
      await invalidateReleaseManagementTeamAssignmentCaches(queryClient)
      toast.success(i18n.t("releaseManagement.assignments.toast.matrixSaved"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("releaseManagement.assignments.toast.updateFailed")
        )
      )
    },
  })
}

export function useCreateReleaseManagementTeamAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ReleaseManagementTeamAssignmentPayload) =>
      releaseManagementTeamAssignmentsService.create(payload),
    onSuccess: async () => {
      await invalidateReleaseManagementTeamAssignmentCaches(queryClient)
      toast.success(i18n.t("releaseManagement.assignments.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("releaseManagement.assignments.toast.createFailed")
        )
      )
    },
  })
}

export function useUpdateReleaseManagementTeamAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: ReleaseManagementTeamAssignmentUpdatePayload
    }) => releaseManagementTeamAssignmentsService.update(id, payload),
    onSuccess: async () => {
      await invalidateReleaseManagementTeamAssignmentCaches(queryClient)
      toast.success(i18n.t("releaseManagement.assignments.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("releaseManagement.assignments.toast.updateFailed")
        )
      )
    },
  })
}

export function useDeleteReleaseManagementTeamAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => releaseManagementTeamAssignmentsService.remove(id),
    onSuccess: async () => {
      await invalidateReleaseManagementTeamAssignmentCaches(queryClient)
      toast.success(i18n.t("releaseManagement.assignments.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("releaseManagement.assignments.toast.deleteFailed")
        )
      )
    },
  })
}
