export type LookupItem = {
  id: number
  name_en: string
  name_ar: string
  code?: string
}

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
  business_owner: string | null
  technical_owner: string | null
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
  business_owner?: string | null
  technical_owner?: string | null
  support_type_id: number
  documentation_url?: string | null
  repository_url?: string | null
  technologies?: number[]
}
