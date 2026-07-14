import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import { assignmentsService } from "@/features/assignments/services/assignments-service"
import type {
  AssignmentListParams,
  AssignmentPayload,
  AssignmentSummaryParams,
  AssignmentUpdatePayload,
  BulkAssignmentPayload,
} from "@/features/assignments/types/assignment"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"
import { lookupsService } from "@/lib/lookups-service"

export const assignmentKeys = {
  all: ["assignments"] as const,
  lists: () => [...assignmentKeys.all, "list"] as const,
  list: (params: AssignmentListParams) =>
    [...assignmentKeys.lists(), params] as const,
  summaries: () => [...assignmentKeys.all, "summary"] as const,
  summary: (params: AssignmentSummaryParams) =>
    [...assignmentKeys.summaries(), params] as const,
  matrices: () => [...assignmentKeys.all, "matrix"] as const,
  matrix: (applicationId: number) =>
    [...assignmentKeys.matrices(), applicationId] as const,
}

export const assignmentLookupKeys = {
  appRoles: ["lookups", "app-roles"] as const,
}

export function useAssignments(params: AssignmentListParams) {
  return useQuery({
    queryKey: assignmentKeys.list(params),
    queryFn: () => assignmentsService.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useApplicationAssignmentsSummary(
  params: AssignmentSummaryParams
) {
  return useQuery({
    queryKey: assignmentKeys.summary(params),
    queryFn: () => assignmentsService.applicationsSummary(params),
    placeholderData: (previous) => previous,
  })
}

export function useApplicationAssignmentDetails(
  applicationId: number | null,
  enabled = true
) {
  return useQuery({
    queryKey: assignmentKeys.matrix(applicationId ?? 0),
    queryFn: () => assignmentsService.applicationMatrix(applicationId!),
    enabled: enabled && applicationId !== null && applicationId > 0,
  })
}

export function useAppRolesLookup() {
  return useQuery({
    queryKey: assignmentLookupKeys.appRoles,
    queryFn: () => lookupsService.appRoles(),
    staleTime: 60_000,
  })
}

async function invalidateAssignmentQueries(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: assignmentKeys.summaries() }),
    queryClient.invalidateQueries({ queryKey: assignmentKeys.matrices() }),
  ])
}

export function useCreateAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AssignmentPayload) =>
      assignmentsService.create(payload),
    onSuccess: async () => {
      await invalidateAssignmentQueries(queryClient)
      toast.success(i18n.t("assignments.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("assignments.toast.createFailed"))
      )
    },
  })
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: AssignmentUpdatePayload
    }) => assignmentsService.update(id, payload),
    onSuccess: async () => {
      await invalidateAssignmentQueries(queryClient)
      toast.success(i18n.t("assignments.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("assignments.toast.updateFailed"))
      )
    },
  })
}

export function useCreateBulkAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: BulkAssignmentPayload) =>
      assignmentsService.bulkCreate(payload),
    onSuccess: async () => {
      await invalidateAssignmentQueries(queryClient)
      toast.success(i18n.t("assignments.toast.bulkCreated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("assignments.toast.createFailed"))
      )
    },
  })
}

export function useEndAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => assignmentsService.end(id),
    onSuccess: async () => {
      await invalidateAssignmentQueries(queryClient)
      toast.success(i18n.t("assignments.toast.ended"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("assignments.toast.endFailed"))
      )
    },
  })
}

export function useSaveAssignmentMatrix() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      applicationId,
      existingUpdates,
      roleChanges,
      newUsers,
    }: {
      applicationId: number
      existingUpdates: Array<{ id: number; is_primary: boolean }>
      roleChanges: Array<{
        user_id: number
        app_role_id: number
        is_primary: boolean
      }>
      newUsers: Array<{
        user_id: number
        app_role_id: number
        is_primary: boolean
      }>
    }) => {
      for (const change of roleChanges) {
        await assignmentsService.create({
          application_id: applicationId,
          user_id: change.user_id,
          app_role_id: change.app_role_id,
          is_primary: change.is_primary,
        })
      }

      for (const update of existingUpdates) {
        await assignmentsService.update(update.id, {
          is_primary: update.is_primary,
        })
      }

      if (newUsers.length > 0) {
        await assignmentsService.bulkCreate({
          application_id: applicationId,
          users: newUsers,
        })
      }
    },
    onSuccess: async () => {
      await invalidateAssignmentQueries(queryClient)
      toast.success(i18n.t("assignments.toast.saved"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("assignments.toast.saveFailed"))
      )
    },
  })
}
