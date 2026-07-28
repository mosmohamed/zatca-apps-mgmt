export type LookupItem = {
  id: number
  name_en: string
  name_ar: string
  code?: string
}

export const HA_MODELS = [
  "Active/Active",
  "Active/Passive",
  "Hot Standby",
  "Cold Standby",
] as const

export type HaModel = (typeof HA_MODELS)[number]

export type DepartmentSummary = {
  id: number
  name_ar: string
  name_en: string
}

export type ApplicationTypeSummary = {
  id: number
  name_ar: string
  name_en: string
  code: string
}

export type ApplicationOwner = {
  id: number
  full_name: string
  email: string
  phone?: string | null
  is_active?: boolean
  job_title?: {
    id: number
    name_en: string
    name_ar: string
  } | null
  vendor?: {
    id: number
    name: string
  } | null
}

export type Application = {
  id: number
  department_id: number
  application_type_id: number
  name_ar: string
  name_en: string
  code: string
  status_id: number
  criticality_id: number
  support_type_id: number
  ha_model: HaModel | null
  business_owners?: ApplicationOwner[]
  technical_owners?: ApplicationOwner[]
  documentation_url: string | null
  repository_url: string | null
  created_by: number | null
  updated_by: number | null
  department?: DepartmentSummary
  application_type?: ApplicationTypeSummary
  status?: LookupItem
  criticality?: LookupItem
  support_type?: LookupItem
  technologies?: TechnologySummary[]
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
}

export type TechnologySummary = {
  id: number
  name: string
  category: string
  description?: string | null
  is_active?: boolean
}

export type ApplicationPayload = {
  department_id: number
  application_type_id: number
  name_ar: string
  name_en: string
  code: string
  status_id: number
  criticality_id: number
  business_owners?: number[]
  technical_owners?: number[]
  support_type_id: number
  ha_model?: HaModel | null
  documentation_url?: string | null
  repository_url?: string | null
  technologies?: number[]
}
