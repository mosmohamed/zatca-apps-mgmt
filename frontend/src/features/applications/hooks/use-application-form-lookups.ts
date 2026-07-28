import { useMemo } from "react"

import {
  useApplicationStatusesLookup,
  useApplicationTypesLookup,
  useCriticalitiesLookup,
  useDepartmentsLookup,
  useSupportTypesLookup,
  useTechnologiesLookup,
} from "@/features/applications/hooks/use-applications"
import type {
  Application,
  LookupItem,
  TechnologySummary,
} from "@/features/applications/types/application"

function mergeById<T extends { id: number }>(
  items: T[],
  current: T | null | undefined
): T[] {
  if (!current || !current.id) {
    return items
  }

  if (items.some((item) => item.id === current.id)) {
    return items
  }

  return [current, ...items]
}

/**
 * Shared lookup bootstrap for create/edit application forms.
 * Ensures dropdown options include the currently selected related records
 * (even if inactive/soft-filtered) and exposes a ready flag for reset timing.
 */
export function useApplicationFormLookups(application?: Application | null) {
  const departmentsQuery = useDepartmentsLookup()
  const typesQuery = useApplicationTypesLookup()
  const statusesQuery = useApplicationStatusesLookup()
  const criticalitiesQuery = useCriticalitiesLookup()
  const supportTypesQuery = useSupportTypesLookup()
  const technologiesQuery = useTechnologiesLookup()

  const isLoading =
    departmentsQuery.isLoading ||
    typesQuery.isLoading ||
    statusesQuery.isLoading ||
    criticalitiesQuery.isLoading ||
    supportTypesQuery.isLoading ||
    technologiesQuery.isLoading

  const isReady =
    departmentsQuery.isSuccess &&
    typesQuery.isSuccess &&
    statusesQuery.isSuccess &&
    criticalitiesQuery.isSuccess &&
    supportTypesQuery.isSuccess &&
    technologiesQuery.isSuccess

  const isError =
    departmentsQuery.isError ||
    typesQuery.isError ||
    statusesQuery.isError ||
    criticalitiesQuery.isError ||
    supportTypesQuery.isError ||
    technologiesQuery.isError

  const departments = useMemo(
    () =>
      mergeById(departmentsQuery.data ?? [], application?.department ?? null),
    [application?.department, departmentsQuery.data]
  )

  const applicationTypes = useMemo(
    () =>
      mergeById(
        typesQuery.data ?? [],
        application?.application_type ?? null
      ),
    [application?.application_type, typesQuery.data]
  )

  const statuses = useMemo(
    () =>
      mergeById<LookupItem>(
        statusesQuery.data ?? [],
        application?.status ?? null
      ),
    [application?.status, statusesQuery.data]
  )

  const criticalities = useMemo(
    () =>
      mergeById<LookupItem>(
        criticalitiesQuery.data ?? [],
        application?.criticality ?? null
      ),
    [application?.criticality, criticalitiesQuery.data]
  )

  const supportTypes = useMemo(
    () =>
      mergeById<LookupItem>(
        supportTypesQuery.data ?? [],
        application?.support_type ?? null
      ),
    [application?.support_type, supportTypesQuery.data]
  )

  const technologies = useMemo(() => {
    const base = technologiesQuery.data ?? []
    const selected = application?.technologies ?? []
    let merged: TechnologySummary[] = base

    for (const technology of selected) {
      merged = mergeById(merged, technology)
    }

    return merged
  }, [application?.technologies, technologiesQuery.data])

  return {
    departments,
    applicationTypes,
    statuses,
    criticalities,
    supportTypes,
    technologies,
    isLoading,
    isReady,
    isError,
  }
}
