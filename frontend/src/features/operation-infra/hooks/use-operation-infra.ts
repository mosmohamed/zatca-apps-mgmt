import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import {
  infraCategoriesService,
  infraLevelsService,
  infraTeamAssignmentsService,
} from "@/features/operation-infra/services/operation-infra-service"
import type {
  InfraCategory,
  InfraCategoryListParams,
  InfraCategoryPayload,
  InfraLevel,
  InfraLevelListParams,
  InfraLevelPayload,
  InfraTeamAssignmentListParams,
  InfraTeamAssignmentPayload,
  InfraTeamAssignmentUpdatePayload,
} from "@/features/operation-infra/types/operation-infra"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"
import { api } from "@/lib/axios"
import type { ApiEnvelope, ListQueryParams } from "@/types/api"

export const infraLevelKeys = {
  all: ["infra-levels"] as const,
  lists: () => [...infraLevelKeys.all, "list"] as const,
  list: (params: InfraLevelListParams) =>
    [...infraLevelKeys.lists(), params] as const,
  lookup: ["lookups", "infra-levels"] as const,
}

export const infraCategoryKeys = {
  all: ["infra-categories"] as const,
  lists: () => [...infraCategoryKeys.all, "list"] as const,
  list: (params: InfraCategoryListParams) =>
    [...infraCategoryKeys.lists(), params] as const,
  trees: () => [...infraCategoryKeys.all, "tree"] as const,
  tree: (activeOnly: boolean) =>
    [...infraCategoryKeys.trees(), activeOnly] as const,
  lookup: ["lookups", "infra-categories"] as const,
  statistics: () => [...infraCategoryKeys.all, "statistics"] as const,
}

export const infraTeamAssignmentKeys = {
  all: ["infra-team-assignments"] as const,
  lists: () => [...infraTeamAssignmentKeys.all, "list"] as const,
  list: (params: InfraTeamAssignmentListParams) =>
    [...infraTeamAssignmentKeys.lists(), params] as const,
  details: () => [...infraTeamAssignmentKeys.all, "details"] as const,
  statistics: () => [...infraTeamAssignmentKeys.all, "statistics"] as const,
  categorySummaries: () =>
    [...infraTeamAssignmentKeys.all, "categories-summary"] as const,
  categorySummary: (params: ListQueryParams) =>
    [...infraTeamAssignmentKeys.categorySummaries(), params] as const,
  categoryMatrix: (id: number) =>
    [...infraTeamAssignmentKeys.all, "category-matrix", id] as const,
}

/* -------------------------------------------------------------------------- */
/* Levels                                                                      */
/* -------------------------------------------------------------------------- */

export function useInfraLevels(params: InfraLevelListParams) {
  return useQuery({
    queryKey: infraLevelKeys.list(params),
    queryFn: () => infraLevelsService.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useInfraLevelsLookup() {
  return useQuery({
    queryKey: infraLevelKeys.lookup,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<InfraLevel[]>>(
        "/lookups/infra-levels"
      )
      return data.data
    },
    staleTime: 60_000,
  })
}

async function invalidateInfraLevelCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: infraLevelKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: infraLevelKeys.lookup }),
    queryClient.invalidateQueries({ queryKey: infraTeamAssignmentKeys.all }),
  ])
}

export function useCreateInfraLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: InfraLevelPayload) =>
      infraLevelsService.create(payload),
    onSuccess: async () => {
      await invalidateInfraLevelCaches(queryClient)
      toast.success(i18n.t("operationInfra.levels.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("operationInfra.levels.toast.createFailed")
        )
      )
    },
  })
}

export function useUpdateInfraLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: InfraLevelPayload
    }) => infraLevelsService.update(id, payload),
    onSuccess: async () => {
      await invalidateInfraLevelCaches(queryClient)
      toast.success(i18n.t("operationInfra.levels.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("operationInfra.levels.toast.updateFailed")
        )
      )
    },
  })
}

export function useDeleteInfraLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => infraLevelsService.remove(id),
    onSuccess: async () => {
      await invalidateInfraLevelCaches(queryClient)
      toast.success(i18n.t("operationInfra.levels.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("operationInfra.levels.toast.deleteFailed")
        )
      )
    },
  })
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                  */
/* -------------------------------------------------------------------------- */

export function useInfraCategories(params: InfraCategoryListParams) {
  return useQuery({
    queryKey: infraCategoryKeys.list(params),
    queryFn: () => infraCategoriesService.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useInfraCategoryStatistics() {
  return useQuery({
    queryKey: infraCategoryKeys.statistics(),
    queryFn: () => infraCategoriesService.statistics(),
  })
}

export function useInfraCategoryTree(activeOnly = false) {
  return useQuery({
    queryKey: infraCategoryKeys.tree(activeOnly),
    queryFn: () => infraCategoriesService.tree(activeOnly),
    placeholderData: (previous) => previous,
  })
}

export function useInfraCategoriesLookup() {
  return useQuery({
    queryKey: infraCategoryKeys.lookup,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<InfraCategory[]>>(
        "/lookups/infra-categories"
      )
      return data.data
    },
    staleTime: 60_000,
  })
}

async function invalidateInfraCategoryCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: infraCategoryKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: infraCategoryKeys.trees() }),
    queryClient.invalidateQueries({ queryKey: infraCategoryKeys.lookup }),
    queryClient.invalidateQueries({ queryKey: infraTeamAssignmentKeys.all }),
  ])
}

export function useCreateInfraCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: InfraCategoryPayload) =>
      infraCategoriesService.create(payload),
    onSuccess: async () => {
      await invalidateInfraCategoryCaches(queryClient)
      toast.success(i18n.t("operationInfra.categories.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("operationInfra.categories.toast.createFailed")
        )
      )
    },
  })
}

export function useUpdateInfraCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: InfraCategoryPayload
    }) => infraCategoriesService.update(id, payload),
    onSuccess: async () => {
      await invalidateInfraCategoryCaches(queryClient)
      toast.success(i18n.t("operationInfra.categories.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("operationInfra.categories.toast.updateFailed")
        )
      )
    },
  })
}

export function useDeleteInfraCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => infraCategoriesService.remove(id),
    onSuccess: async () => {
      await invalidateInfraCategoryCaches(queryClient)
      toast.success(i18n.t("operationInfra.categories.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("operationInfra.categories.toast.deleteFailed")
        )
      )
    },
  })
}

/* -------------------------------------------------------------------------- */
/* Team assignments                                                            */
/* -------------------------------------------------------------------------- */

export function useInfraTeamAssignments(params: InfraTeamAssignmentListParams) {
  return useQuery({
    queryKey: infraTeamAssignmentKeys.list(params),
    queryFn: () => infraTeamAssignmentsService.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useInfraTeamAssignmentStatistics() {
  return useQuery({
    queryKey: infraTeamAssignmentKeys.statistics(),
    queryFn: () => infraTeamAssignmentsService.statistics(),
  })
}

export function useInfraCategoryAssignmentsSummary(params: ListQueryParams) {
  return useQuery({
    queryKey: infraTeamAssignmentKeys.categorySummary(params),
    queryFn: () => infraTeamAssignmentsService.categoriesSummary(params),
    placeholderData: (previous) => previous,
  })
}

export function useInfraCategoryAssignmentMatrix(
  categoryId: number | null,
  enabled = true
) {
  return useQuery({
    queryKey: infraTeamAssignmentKeys.categoryMatrix(categoryId ?? 0),
    queryFn: () =>
      infraTeamAssignmentsService.categoryMatrix(categoryId as number),
    enabled: enabled && categoryId !== null && categoryId > 0,
  })
}

export function useInfraTeamsDetails() {
  return useQuery({
    queryKey: infraTeamAssignmentKeys.details(),
    queryFn: () => infraTeamAssignmentsService.details(),
    placeholderData: (previous) => previous,
  })
}

async function invalidateInfraTeamAssignmentCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await queryClient.invalidateQueries({
    queryKey: infraTeamAssignmentKeys.all,
  })
}

export function useSaveInfraCategoryAssignmentMatrix() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      categoryId,
      existingUpdates,
      newUsers,
      removedIds,
    }: {
      categoryId: number
      existingUpdates: Array<{ id: number; infra_level_id: number }>
      newUsers: Array<{ user_id: number; infra_level_id: number }>
      removedIds: number[]
    }) => {
      for (const id of removedIds) {
        await infraTeamAssignmentsService.remove(id)
      }

      for (const update of existingUpdates) {
        await infraTeamAssignmentsService.update(update.id, {
          infra_level_id: update.infra_level_id,
        })
      }

      if (newUsers.length > 0) {
        await infraTeamAssignmentsService.create({
          infra_category_id: categoryId,
          users: newUsers,
        })
      }
    },
    onSuccess: async () => {
      await invalidateInfraTeamAssignmentCaches(queryClient)
      toast.success(i18n.t("operationInfra.assignments.toast.matrixSaved"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("operationInfra.assignments.toast.updateFailed")
        )
      )
    },
  })
}

export function useCreateInfraTeamAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: InfraTeamAssignmentPayload) =>
      infraTeamAssignmentsService.create(payload),
    onSuccess: async () => {
      await invalidateInfraTeamAssignmentCaches(queryClient)
      toast.success(i18n.t("operationInfra.assignments.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("operationInfra.assignments.toast.createFailed")
        )
      )
    },
  })
}

export function useUpdateInfraTeamAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: InfraTeamAssignmentUpdatePayload
    }) => infraTeamAssignmentsService.update(id, payload),
    onSuccess: async () => {
      await invalidateInfraTeamAssignmentCaches(queryClient)
      toast.success(i18n.t("operationInfra.assignments.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("operationInfra.assignments.toast.updateFailed")
        )
      )
    },
  })
}

export function useDeleteInfraTeamAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => infraTeamAssignmentsService.remove(id),
    onSuccess: async () => {
      await invalidateInfraTeamAssignmentCaches(queryClient)
      toast.success(i18n.t("operationInfra.assignments.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("operationInfra.assignments.toast.deleteFailed")
        )
      )
    },
  })
}
