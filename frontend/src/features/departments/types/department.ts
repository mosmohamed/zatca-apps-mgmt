export type Department = {
  id: number
  name_ar: string
  name_en: string
  created_at: string | null
  updated_at: string | null
}

export type DepartmentPayload = {
  name_ar: string
  name_en: string
}

export type DepartmentStatistics = {
  total: number
  with_applications: number
  without_applications: number
  applications: number
}
