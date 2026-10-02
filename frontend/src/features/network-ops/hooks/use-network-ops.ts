import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import {
  networkOpsCategoriesService,
  networkOpsLevelsService,
  networkOpsTeamAssignmentsService,
} from "@/features/network-ops/services/network-ops-service"
import type {
  NetworkOpsCategory,
  NetworkOpsCategoryListParams,
  NetworkOpsCategoryPayload,
  NetworkOpsLevel,
  NetworkOpsLevelListParams,
  NetworkOpsLevelPayload,
  NetworkOpsTeamAssignmentListParams,
  NetworkOpsTeamAssignmentPayload,
  NetworkOpsTeamAssignmentUpdatePayload,
} from "@/features/network-ops/types/network-ops"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"
import { api } from "@/lib/axios"
import type { ApiEnvelope, ListQueryParams } from "@/types/api"

export const infraLevelKeys = {
  all: ["network-ops-levels"] as const,
  lists: () => [...infraLevelKeys.all, "list"] as const,
  list: (params: NetworkOpsLevelListParams) =>
    [...infraLevelKeys.lists(), params] as const,
  lookup: ["lookups", "network-ops-levels"] as const,
}

export const infraCategoryKeys = {
  all: ["network-ops-categories"] as const,
  lists: () => [...infraCategoryKeys.all, "list"] as const,
  list: (params: NetworkOpsCategoryListParams) =>
    [...infraCategoryKeys.lists(), params] as const,
  trees: () => [...infraCategoryKeys.all, "tree"] as const,
  tree: (activeOnly: boolean) =>
    [...infraCategoryKeys.trees(), activeOnly] as const,
  lookup: ["lookups", "network-ops-categories"] as const,
  statistics: () => [...infraCategoryKeys.all, "statistics"] as const,
}

export const networkOpsTeamAssignmentKeys = {
  all: ["network-ops-team-assignments"] as const,
  lists: () => [...networkOpsTeamAssignmentKeys.all, "list"] as const,
  list: (params: NetworkOpsTeamAssignmentListParams) =>
    [...networkOpsTeamAssignmentKeys.lists(), params] as const,
  details: () => [...networkOpsTeamAssignmentKeys.all, "details"] as const,
  statistics: () => [...networkOpsTeamAssignmentKeys.all, "statistics"] as const,
  categorySummaries: () =>
    [...networkOpsTeamAssignmentKeys.all, "categories-summary"] as const,
  categorySummary: (params: ListQueryParams) =>
    [...networkOpsTeamAssignmentKeys.categorySummaries(), params] as const,
  categoryMatrix: (id: number) =>
    [...networkOpsTeamAssignmentKeys.all, "category-matrix", id] as const,
}

/* -------------------------------------------------------------------------- */
/* Levels                                                                      */
/* -------------------------------------------------------------------------- */

export function useNetworkOpsLevels(params: NetworkOpsLevelListParams) {
  return useQuery({
    queryKey: infraLevelKeys.list(params),
    queryFn: () => networkOpsLevelsService.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useNetworkOpsLevelsLookup() {
  return useQuery({
    queryKey: infraLevelKeys.lookup,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<NetworkOpsLevel[]>>(
        "/lookups/network-ops-levels"
      )
      return data.data
    },
    staleTime: 60_000,
  })
}

async function invalidateNetworkOpsLevelCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: infraLevelKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: infraLevelKeys.lookup }),
    queryClient.invalidateQueries({ queryKey: networkOpsTeamAssignmentKeys.all }),
  ])
}

export function useCreateNetworkOpsLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: NetworkOpsLevelPayload) =>
      networkOpsLevelsService.create(payload),
    onSuccess: async () => {
      await invalidateNetworkOpsLevelCaches(queryClient)
      toast.success(i18n.t("networkOps.levels.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("networkOps.levels.toast.createFailed")
        )
      )
    },
  })
}

export function useUpdateNetworkOpsLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: NetworkOpsLevelPayload
    }) => networkOpsLevelsService.update(id, payload),
    onSuccess: async () => {
      await invalidateNetworkOpsLevelCaches(queryClient)
      toast.success(i18n.t("networkOps.levels.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("networkOps.levels.toast.updateFailed")
        )
      )
    },
  })
}

export function useDeleteNetworkOpsLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => networkOpsLevelsService.remove(id),
    onSuccess: async () => {
      await invalidateNetworkOpsLevelCaches(queryClient)
      toast.success(i18n.t("networkOps.levels.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("networkOps.levels.toast.deleteFailed")
        )
      )
    },
  })
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                  */
/* -------------------------------------------------------------------------- */

export function useNetworkOpsCategories(params: NetworkOpsCategoryListParams) {
  return useQuery({
    queryKey: infraCategoryKeys.list(params),
    queryFn: () => networkOpsCategoriesService.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useNetworkOpsCategoryStatistics() {
  return useQuery({
    queryKey: infraCategoryKeys.statistics(),
    queryFn: () => networkOpsCategoriesService.statistics(),
  })
}

export function useNetworkOpsCategoryTree(activeOnly = false) {
  return useQuery({
    queryKey: infraCategoryKeys.tree(activeOnly),
    queryFn: () => networkOpsCategoriesService.tree(activeOnly),
    placeholderData: (previous) => previous,
  })
}

export function useNetworkOpsCategoriesLookup() {
  return useQuery({
    queryKey: infraCategoryKeys.lookup,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<NetworkOpsCategory[]>>(
        "/lookups/network-ops-categories"
      )
      return data.data
    },
    staleTime: 60_000,
  })
}

async function invalidateNetworkOpsCategoryCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: infraCategoryKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: infraCategoryKeys.trees() }),
    queryClient.invalidateQueries({ queryKey: infraCategoryKeys.lookup }),
    queryClient.invalidateQueries({ queryKey: networkOpsTeamAssignmentKeys.all }),
  ])
}

export function useCreateNetworkOpsCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: NetworkOpsCategoryPayload) =>
      networkOpsCategoriesService.create(payload),
    onSuccess: async () => {
      await invalidateNetworkOpsCategoryCaches(queryClient)
      toast.success(i18n.t("networkOps.categories.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("networkOps.categories.toast.createFailed")
        )
      )
    },
  })
}

export function useUpdateNetworkOpsCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: NetworkOpsCategoryPayload
    }) => networkOpsCategoriesService.update(id, payload),
    onSuccess: async () => {
      await invalidateNetworkOpsCategoryCaches(queryClient)
      toast.success(i18n.t("networkOps.categories.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("networkOps.categories.toast.updateFailed")
        )
      )
    },
  })
}

export function useDeleteNetworkOpsCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => networkOpsCategoriesService.remove(id),
    onSuccess: async () => {
      await invalidateNetworkOpsCategoryCaches(queryClient)
      toast.success(i18n.t("networkOps.categories.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("networkOps.categories.toast.deleteFailed")
        )
      )
    },
  })
}

/* -------------------------------------------------------------------------- */
/* Team assignments                                                            */
/* -------------------------------------------------------------------------- */

export function useNetworkOpsTeamAssignments(params: NetworkOpsTeamAssignmentListParams) {
  return useQuery({
    queryKey: networkOpsTeamAssignmentKeys.list(params),
    queryFn: () => networkOpsTeamAssignmentsService.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useNetworkOpsTeamAssignmentStatistics() {
  return useQuery({
    queryKey: networkOpsTeamAssignmentKeys.statistics(),
    queryFn: () => networkOpsTeamAssignmentsService.statistics(),
  })
}

export function useNetworkOpsCategoryAssignmentsSummary(params: ListQueryParams) {
  return useQuery({
    queryKey: networkOpsTeamAssignmentKeys.categorySummary(params),
    queryFn: () => networkOpsTeamAssignmentsService.categoriesSummary(params),
    placeholderData: (previous) => previous,
  })
}

export function useNetworkOpsCategoryAssignmentMatrix(
  categoryId: number | null,
  enabled = true
) {
  return useQuery({
    queryKey: networkOpsTeamAssignmentKeys.categoryMatrix(categoryId ?? 0),
    queryFn: () =>
      networkOpsTeamAssignmentsService.categoryMatrix(categoryId as number),
    enabled: enabled && categoryId !== null && categoryId > 0,
  })
}

export function useNetworkOpsTeamsDetails() {
  return useQuery({
    queryKey: networkOpsTeamAssignmentKeys.details(),
    queryFn: () => networkOpsTeamAssignmentsService.details(),
    placeholderData: (previous) => previous,
  })
}

async function invalidateNetworkOpsTeamAssignmentCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await queryClient.invalidateQueries({
    queryKey: networkOpsTeamAssignmentKeys.all,
  })
}

export function useSaveNetworkOpsCategoryAssignmentMatrix() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      categoryId,
      existingUpdates,
      newUsers,
      removedIds,
    }: {
      categoryId: number
      existingUpdates: Array<{ id: number; network_ops_level_id: number }>
      newUsers: Array<{ user_id: number; network_ops_level_id: number }>
      removedIds: number[]
    }) => {
      for (const id of removedIds) {
        await networkOpsTeamAssignmentsService.remove(id)
      }

      for (const update of existingUpdates) {
        await networkOpsTeamAssignmentsService.update(update.id, {
          network_ops_level_id: update.network_ops_level_id,
        })
      }

      if (newUsers.length > 0) {
        await networkOpsTeamAssignmentsService.create({
          network_ops_category_id: categoryId,
          users: newUsers,
        })
      }
    },
    onSuccess: async () => {
      await invalidateNetworkOpsTeamAssignmentCaches(queryClient)
      toast.success(i18n.t("networkOps.assignments.toast.matrixSaved"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("networkOps.assignments.toast.updateFailed")
        )
      )
    },
  })
}

export function useCreateNetworkOpsTeamAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: NetworkOpsTeamAssignmentPayload) =>
      networkOpsTeamAssignmentsService.create(payload),
    onSuccess: async () => {
      await invalidateNetworkOpsTeamAssignmentCaches(queryClient)
      toast.success(i18n.t("networkOps.assignments.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("networkOps.assignments.toast.createFailed")
        )
      )
    },
  })
}

export function useUpdateNetworkOpsTeamAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: NetworkOpsTeamAssignmentUpdatePayload
    }) => networkOpsTeamAssignmentsService.update(id, payload),
    onSuccess: async () => {
      await invalidateNetworkOpsTeamAssignmentCaches(queryClient)
      toast.success(i18n.t("networkOps.assignments.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("networkOps.assignments.toast.updateFailed")
        )
      )
    },
  })
}

export function useDeleteNetworkOpsTeamAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => networkOpsTeamAssignmentsService.remove(id),
    onSuccess: async () => {
      await invalidateNetworkOpsTeamAssignmentCaches(queryClient)
      toast.success(i18n.t("networkOps.assignments.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("networkOps.assignments.toast.deleteFailed")
        )
      )
    },
  })
}
