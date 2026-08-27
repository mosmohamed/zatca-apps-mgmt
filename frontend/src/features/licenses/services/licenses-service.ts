import { api } from "@/lib/axios"
import type { ApiEnvelope, PaginatedData } from "@/types/api"
import type {
  License,
  LicenseListQueryParams,
  LicensePayload,
  LicenseStatistics,
} from "@/features/licenses/types/license"

function toQuery(
  params: LicenseListQueryParams
): Record<string, string | number> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    per_page: params.per_page ?? 15,
  }

  if (params.search?.trim()) {
    query.search = params.search.trim()
  }

  if (params.sort) {
    query.sort = params.sort
  }

  if (params.environment?.trim()) {
    query.environment = params.environment.trim()
  }

  if (params.status?.trim()) {
    query.status = params.status.trim()
  }

  return query
}

export function createLicensesService(apiBase: string) {
  const base = `/${apiBase.replace(/^\/+/, "")}`

  return {
    async list(
      params: LicenseListQueryParams = {}
    ): Promise<PaginatedData<License>> {
      const { data } = await api.get<ApiEnvelope<PaginatedData<License>>>(
        base,
        { params: toQuery(params) }
      )
      return data.data
    },

    async get(id: number): Promise<License> {
      const { data } = await api.get<ApiEnvelope<License>>(`${base}/${id}`)
      return data.data
    },

    async create(payload: LicensePayload): Promise<License> {
      const { data } = await api.post<ApiEnvelope<License>>(base, payload)
      return data.data
    },

    async update(id: number, payload: LicensePayload): Promise<License> {
      const { data } = await api.put<ApiEnvelope<License>>(
        `${base}/${id}`,
        payload
      )
      return data.data
    },

    async remove(id: number): Promise<void> {
      await api.delete<ApiEnvelope<null>>(`${base}/${id}`)
    },

    async statistics(): Promise<LicenseStatistics> {
      const { data } = await api.get<ApiEnvelope<LicenseStatistics>>(
        `${base}/statistics`
      )
      return data.data
    },
  }
}

const serviceCache = new Map<string, ReturnType<typeof createLicensesService>>()

export function getLicensesService(apiBase: string) {
  const key = apiBase.replace(/^\/+/, "")
  const cached = serviceCache.get(key)
  if (cached) {
    return cached
  }
  const created = createLicensesService(key)
  serviceCache.set(key, created)
  return created
}

/** @deprecated Prefer getLicensesService — kept for apps module default. */
export const licensesService = getLicensesService("licenses")
