import type { ListQueryParams } from "@/types/api"

export type ServiceDeskLevel = {
  id: number
  code: string
  name_en: string
  name_ar: string
  note_en: string | null
  note_ar: string | null
  sort_order: number
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

export type ServiceDeskLevelPayload = {
  name_en: string
  name_ar: string
  code: string
  note_en?: string | null
  note_ar?: string | null
  sort_order?: number
  is_active?: boolean
}

export type ServiceDeskCategoryParentSummary = {
  id: number
  name_en: string
  name_ar: string
  code: string
}

export type ServiceDeskCategory = {
  id: number
  parent_id: number | null
  name_en: string
  name_ar: string
  code: string
  description: string | null
  sort_order: number
  is_active: boolean
  parent?: ServiceDeskCategoryParentSummary | null
  children?: ServiceDeskCategory[]
  children_count?: number
  assignments_count?: number
  title_en?: string
  title_ar?: string
  assignments?: ServiceDeskTeamAssignment[]
  created_at: string | null
  updated_at: string | null
}

export type ServiceDeskCategoryPayload = {
  parent_id?: number | null
  name_en: string
  name_ar: string
  code: string
  description?: string | null
  sort_order?: number
  is_active?: boolean
}

export type ServiceDeskTeamAssignmentUser = {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string | null
}

export type ServiceDeskTeamAssignment = {
  id: number
  service_desk_category_id: number
  user_id: number
  service_desk_level_id: number
  sort_order: number
  category?: ServiceDeskCategory | null
  level?: ServiceDeskLevel | null
  user?: ServiceDeskTeamAssignmentUser | null
  created_at: string | null
  updated_at: string | null
}

export type ServiceDeskTeamAssignmentPayload = {
  service_desk_category_id: number
  users: Array<{
    user_id: number
    service_desk_level_id: number
    sort_order?: number
  }>
}

export type ServiceDeskTeamAssignmentUpdatePayload = {
  service_desk_category_id?: number
  user_id?: number
  service_desk_level_id?: number
  sort_order?: number
}

export type ServiceDeskCategoryAssignmentSummary = {
  id: number
  code: string
  name_en: string
  name_ar: string
  title_en: string
  title_ar: string
  parent: ServiceDeskCategoryParentSummary | null
  assignments_count: number
}

export type ServiceDeskCategoryAssignmentMatrix = ServiceDeskCategory & {
  title_en: string
  title_ar: string
  assignments: ServiceDeskTeamAssignment[]
  assignments_count: number
}

export type ServiceDeskTeamDetailsMember = {
  assignment_id: number
  user_id: number
  full_name: string
  email: string | null
  phone: string | null
  job_title?: string | null
}

export type ServiceDeskTeamDetailsLevel = {
  id: number
  code: string
  name_en: string
  name_ar: string
  note_en: string | null
  note_ar: string | null
  sort_order: number
  members: ServiceDeskTeamDetailsMember[]
}

export type ServiceDeskTeamsDetailsCard = {
  id: number
  code: string
  name_en: string
  name_ar: string
  title_en: string
  title_ar: string
  parent: ServiceDeskCategoryParentSummary | null
  members_count: number
  levels: ServiceDeskTeamDetailsLevel[]
}

export type ServiceDeskLevelListParams = ListQueryParams & {
  active_only?: boolean
}

export type ServiceDeskCategoryListParams = ListQueryParams & {
  category_type?: "parent" | "subcategory"
  active_status?: "active" | "inactive"
  roots_only?: boolean
  parent_id?: number | null
  active_only?: boolean
}

export type ServiceDeskCategoryStatistics = {
  total: number
  parents: number
  subcategories: number
  without_assignments: number
}

export type ServiceDeskTeamAssignmentStatistics = {
  total: number
  unique_users: number
  assigned_categories: number
  unassigned_categories: number
}

export type ServiceDeskTeamAssignmentListParams = ListQueryParams & {
  service_desk_category_id?: number
  service_desk_level_id?: number
  user_id?: number
}
