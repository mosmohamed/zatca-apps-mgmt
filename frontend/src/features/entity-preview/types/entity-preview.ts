import type { HaModel } from "@/features/applications/types/application"

export type PreviewLookup = {
  id: number
  name_en: string
  name_ar: string
}

export type PreviewVendorRef = {
  id: number
  name: string
}

export type UserPreview = {
  id: number
  full_name: string
  initials: string
  email: string
  phone: string | null
  extension: string | null
  teams: string | null
  is_active: boolean
  job_title: PreviewLookup | null
  vendor: PreviewVendorRef | null
  roles: string[]
  active_assignments_count: number
}

export type VendorPreview = {
  id: number
  name: string
  initials: string
  email: string | null
  phone: string | null
  contact_person_email: string | null
  contact_person_phone: string | null
  remarks: string | null
  status: boolean
  users_count: number
  active_users_count: number
}

export type ApplicationPreview = {
  id: number
  name_en: string
  name_ar: string
  code: string
  ha_model: HaModel | null
  business_owners?: Array<{
    id: number
    full_name: string
    email: string
  }>
  technical_owners?: Array<{
    id: number
    full_name: string
    email: string
  }>
  documentation_url: string | null
  repository_url: string | null
  department: PreviewLookup | null
  application_type: PreviewLookup | null
  status: PreviewLookup | null
  criticality: PreviewLookup | null
  support_type: PreviewLookup | null
  active_assignments_count: number
  technologies_count: number
}

export type DepartmentPreview = {
  id: number
  name_en: string
  name_ar: string
  initials: string
  applications_count: number
}
