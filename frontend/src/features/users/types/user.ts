export type UserVendor = {
  id: number
  name: string
  status: boolean
}

export type JobTitleSummary = {
  id: number
  name_en: string
  name_ar: string
}

export type ManagedUser = {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string
  vendor_id: number | null
  phone: string | null
  teams: string | null
  whatsapp: string | null
  extension: string | null
  job_title_id: number | null
  is_active: boolean
  vendor?: UserVendor | null
  job_title?: JobTitleSummary | null
  roles?: string[]
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
}

export type UserPayload = {
  first_name: string
  last_name: string
  email: string
  password?: string
  password_confirmation?: string
  vendor_id?: number | null
  phone?: string | null
  teams?: string | null
  whatsapp?: string | null
  extension?: string | null
  job_title_id?: number | null
  is_active?: boolean
  roles?: string[]
}
