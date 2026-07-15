export const LICENSE_STATUSES = [
  "active",
  "expiring_soon",
  "expired",
] as const

export type LicenseStatus = (typeof LICENSE_STATUSES)[number]

export type License = {
  id: number
  publisher: string
  name: string
  product: string
  version: string | null
  description: string | null
  environment: string
  licensed: number
  used: number
  available: number
  proof_of_entitlement: string | null
  start_date: string | null
  end_date: string | null
  status: LicenseStatus | string
  days_remaining: number | null
  created_at: string | null
  updated_at: string | null
  deleted_at?: string | null
}

export type LicensePayload = {
  publisher: string
  name: string
  product: string
  version?: string | null
  description?: string | null
  environment: string
  licensed: number
  used: number
  proof_of_entitlement?: string | null
  start_date?: string | null
  end_date?: string | null
}

export type LicenseStatistics = {
  total_licenses: number
  total_licensed: number
  total_used: number
  total_available: number
  expiring_within_30_days: number
  expired: number
}

export type LicenseListQueryParams = {
  page?: number
  per_page?: number
  search?: string
  sort?: string
  environment?: string
  status?: string
}
