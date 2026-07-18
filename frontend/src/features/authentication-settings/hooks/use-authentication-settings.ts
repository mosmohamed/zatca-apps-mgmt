import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { authenticationSettingsService } from "@/features/authentication-settings/services/authentication-settings-service"
import type {
  IdentityProviderPayload,
  RoleMappingPayload,
} from "@/features/authentication-settings/types/authentication-settings"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"
import type { ListQueryParams } from "@/types/api"

export const authenticationKeys = {
  all: ["authentication-settings"] as const,
  publicProviders: ["public-identity-providers"] as const,
  providers: (params: ListQueryParams) => [...authenticationKeys.all, "providers", params] as const,
  mappings: (params: ListQueryParams) => [...authenticationKeys.all, "mappings", params] as const,
}

export function usePublicIdentityProviders() {
  return useQuery({
    queryKey: authenticationKeys.publicProviders,
    queryFn: authenticationSettingsService.publicProviders,
    staleTime: 60_000,
  })
}

export function useIdentityProviders(params: ListQueryParams) {
  return useQuery({
    queryKey: authenticationKeys.providers(params),
    queryFn: () => authenticationSettingsService.providers(params),
  })
}

function useProviderInvalidation() {
  const client = useQueryClient()
  return async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: authenticationKeys.all }),
      client.invalidateQueries({ queryKey: authenticationKeys.publicProviders }),
    ])
  }
}

export function useCreateProvider() {
  const invalidate = useProviderInvalidation()
  return useMutation({
    mutationFn: ({ payload }: { payload: IdentityProviderPayload }) =>
      authenticationSettingsService.createProvider(payload),
    onSuccess: async () => { await invalidate(); toast.success(i18n.t("authentication.toast.providercreate")) },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, i18n.t("authentication.toast.providercreateFailed"))),
  })
}

export function useUpdateProvider() {
  const invalidate = useProviderInvalidation()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: IdentityProviderPayload }) =>
      authenticationSettingsService.updateProvider(id, payload),
    onSuccess: async () => { await invalidate(); toast.success(i18n.t("authentication.toast.providerupdate")) },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, i18n.t("authentication.toast.providerupdateFailed"))),
  })
}

export function useDeleteProvider() {
  const invalidate = useProviderInvalidation()
  return useMutation({
    mutationFn: ({ id }: { id: number }) => authenticationSettingsService.deleteProvider(id),
    onSuccess: async () => { await invalidate(); toast.success(i18n.t("authentication.toast.providerdelete")) },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, i18n.t("authentication.toast.providerdeleteFailed"))),
  })
}

export function useTestProvider() {
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      authenticationSettingsService.testProvider(id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message || i18n.t("authentication.toast.testSuccess"))
      } else {
        toast.error(result.message || i18n.t("authentication.toast.testFailed"))
      }
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, i18n.t("authentication.toast.testFailed"))),
  })
}

export function useRoleMappings(params: ListQueryParams) {
  return useQuery({
    queryKey: authenticationKeys.mappings(params),
    queryFn: () => authenticationSettingsService.mappings(params),
  })
}

function useMappingInvalidation() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: authenticationKeys.all })
}

export function useCreateRoleMapping() {
  const invalidate = useMappingInvalidation()
  return useMutation({
    mutationFn: ({ payload }: { payload: RoleMappingPayload }) =>
      authenticationSettingsService.createMapping(payload),
    onSuccess: async () => { await invalidate(); toast.success(i18n.t("authentication.toast.mappingcreate")) },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, i18n.t("authentication.toast.mappingcreateFailed"))),
  })
}

export function useUpdateRoleMapping() {
  const invalidate = useMappingInvalidation()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RoleMappingPayload }) =>
      authenticationSettingsService.updateMapping(id, payload),
    onSuccess: async () => { await invalidate(); toast.success(i18n.t("authentication.toast.mappingupdate")) },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, i18n.t("authentication.toast.mappingupdateFailed"))),
  })
}

export function useDeleteRoleMapping() {
  const invalidate = useMappingInvalidation()
  return useMutation({
    mutationFn: ({ id }: { id: number }) => authenticationSettingsService.deleteMapping(id),
    onSuccess: async () => { await invalidate(); toast.success(i18n.t("authentication.toast.mappingdelete")) },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, i18n.t("authentication.toast.mappingdeleteFailed"))),
  })
}
