import { useQuery } from "@tanstack/react-query"

import { entityPreviewService } from "@/features/entity-preview/services/entity-preview-service"

/** Previews are read-only summaries, so a five minute cache is plenty. */
const PREVIEW_STALE_TIME = 5 * 60 * 1000
const PREVIEW_GC_TIME = 10 * 60 * 1000

export const entityPreviewKeys = {
  all: ["entity-preview"] as const,
  user: (id: number) => [...entityPreviewKeys.all, "user", id] as const,
  userByName: (name: string) =>
    [...entityPreviewKeys.all, "user-by-name", name] as const,
  vendor: (id: number) => [...entityPreviewKeys.all, "vendor", id] as const,
  application: (id: number) =>
    [...entityPreviewKeys.all, "application", id] as const,
  department: (id: number) =>
    [...entityPreviewKeys.all, "department", id] as const,
}

function isValidId(id: number | null | undefined): id is number {
  return typeof id === "number" && Number.isFinite(id) && id > 0
}

export function useUserPreview(id: number | null | undefined, enabled: boolean) {
  return useQuery({
    queryKey: entityPreviewKeys.user(id ?? 0),
    queryFn: () => entityPreviewService.user(id as number),
    enabled: enabled && isValidId(id),
    staleTime: PREVIEW_STALE_TIME,
    gcTime: PREVIEW_GC_TIME,
    retry: false,
  })
}

export function useUserPreviewByName(name: string, enabled: boolean) {
  const normalized = name.trim()

  return useQuery({
    queryKey: entityPreviewKeys.userByName(normalized.toLowerCase()),
    queryFn: () => entityPreviewService.userByName(normalized),
    enabled: enabled && normalized.length > 0,
    staleTime: PREVIEW_STALE_TIME,
    gcTime: PREVIEW_GC_TIME,
    retry: false,
  })
}

export function useVendorPreview(
  id: number | null | undefined,
  enabled: boolean
) {
  return useQuery({
    queryKey: entityPreviewKeys.vendor(id ?? 0),
    queryFn: () => entityPreviewService.vendor(id as number),
    enabled: enabled && isValidId(id),
    staleTime: PREVIEW_STALE_TIME,
    gcTime: PREVIEW_GC_TIME,
    retry: false,
  })
}

export function useApplicationPreview(
  id: number | null | undefined,
  enabled: boolean
) {
  return useQuery({
    queryKey: entityPreviewKeys.application(id ?? 0),
    queryFn: () => entityPreviewService.application(id as number),
    enabled: enabled && isValidId(id),
    staleTime: PREVIEW_STALE_TIME,
    gcTime: PREVIEW_GC_TIME,
    retry: false,
  })
}

export function useDepartmentPreview(
  id: number | null | undefined,
  enabled: boolean
) {
  return useQuery({
    queryKey: entityPreviewKeys.department(id ?? 0),
    queryFn: () => entityPreviewService.department(id as number),
    enabled: enabled && isValidId(id),
    staleTime: PREVIEW_STALE_TIME,
    gcTime: PREVIEW_GC_TIME,
    retry: false,
  })
}
