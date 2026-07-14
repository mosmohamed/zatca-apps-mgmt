import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import { jobTitlesService } from "@/features/job-titles/services/job-titles-service"
import type { JobTitlePayload } from "@/features/job-titles/types/job-title"
import { userLookupKeys } from "@/features/users/hooks/use-users"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"
import type { ListQueryParams } from "@/types/api"

export const jobTitleKeys = {
  all: ["job-titles"] as const,
  lists: () => [...jobTitleKeys.all, "list"] as const,
  list: (params: ListQueryParams) =>
    [...jobTitleKeys.lists(), params] as const,
}

export function useJobTitles(params: ListQueryParams) {
  return useQuery({
    queryKey: jobTitleKeys.list(params),
    queryFn: () => jobTitlesService.list(params),
    placeholderData: (previous) => previous,
  })
}

async function invalidateJobTitleCaches(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: jobTitleKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: userLookupKeys.jobTitles }),
  ])
}

export function useCreateJobTitle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: JobTitlePayload) => jobTitlesService.create(payload),
    onSuccess: async () => {
      await invalidateJobTitleCaches(queryClient)
      toast.success(i18n.t("jobTitles.toast.created"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("jobTitles.toast.createFailed"))
      )
    },
  })
}

export function useUpdateJobTitle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: JobTitlePayload
    }) => jobTitlesService.update(id, payload),
    onSuccess: async () => {
      await invalidateJobTitleCaches(queryClient)
      toast.success(i18n.t("jobTitles.toast.updated"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("jobTitles.toast.updateFailed"))
      )
    },
  })
}

export function useDeleteJobTitle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => jobTitlesService.remove(id),
    onSuccess: async () => {
      await invalidateJobTitleCaches(queryClient)
      toast.success(i18n.t("jobTitles.toast.deleted"))
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, i18n.t("jobTitles.toast.deleteFailed"))
      )
    },
  })
}
