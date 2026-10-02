import type { ListQueryParams } from "@/types/api"

export type SmartFacilitiesLevel = {
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

export type SmartFacilitiesLevelPayload = {
  name_en: string
  name_ar: string
  code: string
  note_en?: string | null
  note_ar?: string | null
  sort_order?: number
  is_active?: boolean
}

export type SmartFacilitiesCategoryParentSummary = {
  id: number
  name_en: string
  name_ar: string
  code: string
}

export type SmartFacilitiesCategory = {
  id: number
  parent_id: number | null
  name_en: string
  name_ar: string
  code: string
  description: string | null
  sort_order: number
  is_active: boolean
  parent?: SmartFacilitiesCategoryParentSummary | null
  children?: SmartFacilitiesCategory[]
  children_count?: number
  assignments_count?: number
  title_en?: string
  title_ar?: string
  assignments?: SmartFacilitiesTeamAssignment[]
  created_at: string | null
  updated_at: string | null
}

export type SmartFacilitiesCategoryPayload = {
  parent_id?: number | null
  name_en: string
  name_ar: string
  code: string
  description?: string | null
  sort_order?: number
  is_active?: boolean
}

export type SmartFacilitiesTeamAssignmentUser = {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string | null
}

export type SmartFacilitiesTeamAssignment = {
  id: number
  smart_facilities_category_id: number
  user_id: number
  smart_facilities_level_id: number
  sort_order: number
  category?: SmartFacilitiesCategory | null
  level?: SmartFacilitiesLevel | null
  user?: SmartFacilitiesTeamAssignmentUser | null
  created_at: string | null
  updated_at: string | null
}

export type SmartFacilitiesTeamAssignmentPayload = {
  smart_facilities_category_id: number
  users: Array<{
    user_id: number
    smart_facilities_level_id: number
    sort_order?: number
  }>
}

export type SmartFacilitiesTeamAssignmentUpdatePayload = {
  smart_facilities_category_id?: number
  user_id?: number
  smart_facilities_level_id?: number
  sort_order?: number
}

export type SmartFacilitiesCategoryAssignmentSummary = {
  id: number
  code: string
  name_en: string
  name_ar: string
  title_en: string
  title_ar: string
  parent: SmartFacilitiesCategoryParentSummary | null
  assignments_count: number
}

export type SmartFacilitiesCategoryAssignmentMatrix = SmartFacilitiesCategory & {
  title_en: string
  title_ar: string
  assignments: SmartFacilitiesTeamAssignment[]
  assignments_count: number
}

export type SmartFacilitiesTeamDetailsMember = {
  assignment_id: number
  user_id: number
  full_name: string
  email: string | null
  phone: string | null
  job_title?: string | null
}

export type SmartFacilitiesTeamDetailsLevel = {
  id: number
  code: string
  name_en: string
  name_ar: string
  note_en: string | null
  note_ar: string | null
  sort_order: number
  members: SmartFacilitiesTeamDetailsMember[]
}

export type SmartFacilitiesTeamsDetailsCard = {
  id: number
  code: string
  name_en: string
  name_ar: string
  title_en: string
  title_ar: string
  parent: SmartFacilitiesCategoryParentSummary | null
  members_count: number
  levels: SmartFacilitiesTeamDetailsLevel[]
}

export type SmartFacilitiesLevelListParams = ListQueryParams & {
  active_only?: boolean
}

export type SmartFacilitiesCategoryListParams = ListQueryParams & {
  category_type?: "parent" | "subcategory"
  active_status?: "active" | "inactive"
  roots_only?: boolean
  parent_id?: number | null
  active_only?: boolean
}

export type SmartFacilitiesCategoryStatistics = {
  total: number
  parents: number
  subcategories: number
  without_assignments: number
}

export type SmartFacilitiesTeamAssignmentStatistics = {
  total: number
  unique_users: number
  assigned_categories: number
  unassigned_categories: number
}

export type SmartFacilitiesTeamAssignmentListParams = ListQueryParams & {
  smart_facilities_category_id?: number
  smart_facilities_level_id?: number
  user_id?: number
}
