export type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
  errors: Record<string, string[]> | null
}

export type AuthUser = {
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
  roles: string[]
  permissions: string[]
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
}

export type LoginPayload = {
  email: string
  password: string
}

export type LoginResponse = {
  token: string
  token_type: string
  user: AuthUser
}
