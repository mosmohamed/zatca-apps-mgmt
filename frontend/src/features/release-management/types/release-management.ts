import type { ListQueryParams } from "@/types/api"

export type ReleaseManagementLevel = {
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

export type ReleaseManagementLevelPayload = {
  name_en: string
  name_ar: string
  code: string
  note_en?: string | null
  note_ar?: string | null
  sort_order?: number
  is_active?: boolean
}

export type ReleaseManagementCategoryParentSummary = {
  id: number
  name_en: string
  name_ar: string
  code: string
}

export type ReleaseManagementCategory = {
  id: number
  parent_id: number | null
  name_en: string
  name_ar: string
  code: string
  description: string | null
  sort_order: number
  is_active: boolean
  parent?: ReleaseManagementCategoryParentSummary | null
  children?: ReleaseManagementCategory[]
  children_count?: number
  assignments_count?: number
  title_en?: string
  title_ar?: string
  assignments?: ReleaseManagementTeamAssignment[]
  created_at: string | null
  updated_at: string | null
}

export type ReleaseManagementCategoryPayload = {
  parent_id?: number | null
  name_en: string
  name_ar: string
  code: string
  description?: string | null
  sort_order?: number
  is_active?: boolean
}

export type ReleaseManagementTeamAssignmentUser = {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string | null
}

export type ReleaseManagementTeamAssignment = {
  id: number
  release_management_category_id: number
  user_id: number
  release_management_level_id: number
  sort_order: number
  category?: ReleaseManagementCategory | null
  level?: ReleaseManagementLevel | null
  user?: ReleaseManagementTeamAssignmentUser | null
  created_at: string | null
  updated_at: string | null
}

export type ReleaseManagementTeamAssignmentPayload = {
  release_management_category_id: number
  users: Array<{
    user_id: number
    release_management_level_id: number
    sort_order?: number
  }>
}

export type ReleaseManagementTeamAssignmentUpdatePayload = {
  release_management_category_id?: number
  user_id?: number
  release_management_level_id?: number
  sort_order?: number
}

export type ReleaseManagementCategoryAssignmentSummary = {
  id: number
  code: string
  name_en: string
  name_ar: string
  title_en: string
  title_ar: string
  parent: ReleaseManagementCategoryParentSummary | null
  assignments_count: number
}

export type ReleaseManagementCategoryAssignmentMatrix = ReleaseManagementCategory & {
  title_en: string
  title_ar: string
  assignments: ReleaseManagementTeamAssignment[]
  assignments_count: number
}

export type ReleaseManagementTeamDetailsMember = {
  assignment_id: number
  user_id: number
  full_name: string
  email: string | null
  phone: string | null
  job_title?: string | null
}

export type ReleaseManagementTeamDetailsLevel = {
  id: number
  code: string
  name_en: string
  name_ar: string
  note_en: string | null
  note_ar: string | null
  sort_order: number
  members: ReleaseManagementTeamDetailsMember[]
}

export type ReleaseManagementTeamsDetailsCard = {
  id: number
  code: string
  name_en: string
  name_ar: string
  title_en: string
  title_ar: string
  parent: ReleaseManagementCategoryParentSummary | null
  members_count: number
  levels: ReleaseManagementTeamDetailsLevel[]
}

export type ReleaseManagementLevelListParams = ListQueryParams & {
  active_only?: boolean
}

export type ReleaseManagementCategoryListParams = ListQueryParams & {
  category_type?: "parent" | "subcategory"
  active_status?: "active" | "inactive"
  roots_only?: boolean
  parent_id?: number | null
  active_only?: boolean
}

export type ReleaseManagementCategoryStatistics = {
  total: number
  parents: number
  subcategories: number
  without_assignments: number
}

export type ReleaseManagementTeamAssignmentStatistics = {
  total: number
  unique_users: number
  assigned_categories: number
  unassigned_categories: number
}

export type ReleaseManagementTeamAssignmentListParams = ListQueryParams & {
  release_management_category_id?: number
  release_management_level_id?: number
  user_id?: number
}
