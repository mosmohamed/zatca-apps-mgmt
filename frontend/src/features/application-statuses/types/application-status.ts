export type ApplicationStatus = {
  id: number
  name_en: string
  name_ar: string
  code: string
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

export type ApplicationStatusPayload = {
  name_en: string
  name_ar: string
  code: string
  is_active?: boolean
}
