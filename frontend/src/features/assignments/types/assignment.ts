export type AssignmentVendor = {
  id: number
  name: string
}

export type AssignmentApplication = {
  id: number
  name_en: string
  name_ar: string
  code: string
  department?: {
    id: number
    name_en: string
    name_ar: string
  } | null
  status?: {
    id: number
    name_en: string
    name_ar: string
    code: string
  } | null
}

export type AssignmentUser = {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string
  vendor?: AssignmentVendor | null
}

export type AssignmentAppRole = {
  id: number
  name: string
}

export type Assignment = {
  id: number
  application_id: number
  user_id: number
  app_role_id: number
  assigned_by: number
  assigned_at: string | null
  ended_at: string | null
  is_primary: boolean
  remarks: string | null
  is_open: boolean
  application?: AssignmentApplication
  user?: AssignmentUser
  app_role?: AssignmentAppRole
  assigned_by_user?: AssignmentUser
  created_at: string | null
  updated_at: string | null
}

export type AssignmentSummary = {
  id: number
  name_en: string
  name_ar: string
  code: string
  status_id: number
  department_id: number
  active_users_count: number
  department?: {
    id: number
    name_en: string
    name_ar: string
  } | null
  status?: {
    id: number
    name_en: string
    name_ar: string
    code: string
  } | null
  created_at: string | null
  updated_at: string | null
}

export type AssignmentMatrixApplication = AssignmentApplication & {
  id: number
  department_id: number
  status_id: number
  assignments?: Assignment[]
}

export type AssignmentPayload = {
  application_id: number
  user_id: number
  app_role_id: number
  is_primary?: boolean
  remarks?: string | null
}

export type AssignmentUpdatePayload = {
  is_primary?: boolean
  remarks?: string | null
}

export type AssignmentListParams = {
  page?: number
  per_page?: number
  search?: string
  sort?: string
  application_id?: number
  user_id?: number
  open_only?: boolean
}

export type AssignmentSummaryParams = {
  page?: number
  per_page?: number
  search?: string
  sort?: string
}

export type BulkAssignmentPayload = {
  application_id: number
  users: Array<{
    user_id: number
    app_role_id: number
    is_primary?: boolean
    remarks?: string | null
  }>
}

export type AssignmentStatistics = {
  open_assignments: number
  ended_assignments: number
  applications_with_assignments: number
  assigned_users: number
}
