export type Vendor = {
  id: number
  name: string
  email: string | null
  phone: string | null
  contact_person_email: string | null
  contact_person_phone: string | null
  remarks: string | null
  status: boolean
  areas?: string[]
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
}

export type VendorPayload = {
  name: string
  email?: string | null
  phone?: string | null
  contact_person_email?: string | null
  contact_person_phone?: string | null
  remarks?: string | null
  status?: boolean
  areas?: string[]
}

export type VendorStatistics = {
  total: number
  active: number
  inactive: number
  with_users: number
}
