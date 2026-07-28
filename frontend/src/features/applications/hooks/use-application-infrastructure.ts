import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { applicationInfrastructureService } from "@/features/applications/services/infrastructure-service"
import type {
  CopyEnvironmentPayload,
  UpsertEnvironmentPayload,
} from "@/features/applications/types/infrastructure"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"

export const applicationInfrastructureKeys = {
  all: ["application-infrastructure"] as const,
  detail: (applicationId: number) =>
    [...applicationInfrastructureKeys.all, applicationId] as const,
}

export function useApplicationInfrastructure(
  applicationId: number,
  enabled = true
) {
  return useQuery({
    queryKey: applicationInfrastructureKeys.detail(applicationId),
    queryFn: () => applicationInfrastructureService.get(applicationId),
    enabled: enabled && Number.isFinite(applicationId) && applicationId > 0,
  })
}

export function useUpsertEnvironmentInfrastructure(applicationId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      environmentId,
      payload,
    }: {
      environmentId: number
      payload: UpsertEnvironmentPayload
    }) =>
      applicationInfrastructureService.upsertEnvironment(
        applicationId,
        environmentId,
        payload
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: applicationInfrastructureKeys.detail(applicationId),
      })
      toast.success(i18n.t("applications.infrastructure.toast.saved"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("applications.infrastructure.toast.saveFailed")
        )
      )
    },
  })
}

export function useDeleteEnvironmentInfrastructure(applicationId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (environmentId: number) =>
      applicationInfrastructureService.deleteEnvironment(
        applicationId,
        environmentId
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: applicationInfrastructureKeys.detail(applicationId),
      })
      toast.success(i18n.t("applications.infrastructure.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("applications.infrastructure.toast.deleteFailed")
        )
      )
    },
  })
}

export function useCopyEnvironmentInfrastructure(applicationId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CopyEnvironmentPayload) =>
      applicationInfrastructureService.copyEnvironment(applicationId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: applicationInfrastructureKeys.detail(applicationId),
      })
      toast.success(i18n.t("applications.infrastructure.toast.copied"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          i18n.t("applications.infrastructure.toast.copyFailed")
        )
      )
    },
  })
}
