export type SupportType = {
  id: number
  name_en: string
  name_ar: string
  code: string
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

export type SupportTypePayload = {
  name_en: string
  name_ar: string
  code: string
  is_active?: boolean
}
