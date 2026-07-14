export type JobTitle = {
  id: number
  name_en: string
  name_ar: string
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
}

export type JobTitlePayload = {
  name_en: string
  name_ar: string
  description?: string | null
  is_active?: boolean
  sort_order?: number
}
