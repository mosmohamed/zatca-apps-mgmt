import type { ListQueryParams } from "@/types/api"

export type NetworkOpsLevel = {
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

export type NetworkOpsLevelPayload = {
  name_en: string
  name_ar: string
  code: string
  note_en?: string | null
  note_ar?: string | null
  sort_order?: number
  is_active?: boolean
}

export type NetworkOpsCategoryParentSummary = {
  id: number
  name_en: string
  name_ar: string
  code: string
}

export type NetworkOpsCategory = {
  id: number
  parent_id: number | null
  name_en: string
  name_ar: string
  code: string
  description: string | null
  sort_order: number
  is_active: boolean
  parent?: NetworkOpsCategoryParentSummary | null
  children?: NetworkOpsCategory[]
  children_count?: number
  assignments_count?: number
  title_en?: string
  title_ar?: string
  assignments?: NetworkOpsTeamAssignment[]
  created_at: string | null
  updated_at: string | null
}

export type NetworkOpsCategoryPayload = {
  parent_id?: number | null
  name_en: string
  name_ar: string
  code: string
  description?: string | null
  sort_order?: number
  is_active?: boolean
}

export type NetworkOpsTeamAssignmentUser = {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string | null
}

export type NetworkOpsTeamAssignment = {
  id: number
  network_ops_category_id: number
  user_id: number
  network_ops_level_id: number
  sort_order: number
  category?: NetworkOpsCategory | null
  level?: NetworkOpsLevel | null
  user?: NetworkOpsTeamAssignmentUser | null
  created_at: string | null
  updated_at: string | null
}

export type NetworkOpsTeamAssignmentPayload = {
  network_ops_category_id: number
  users: Array<{
    user_id: number
    network_ops_level_id: number
    sort_order?: number
  }>
}

export type NetworkOpsTeamAssignmentUpdatePayload = {
  network_ops_category_id?: number
  user_id?: number
  network_ops_level_id?: number
  sort_order?: number
}

export type NetworkOpsCategoryAssignmentSummary = {
  id: number
  code: string
  name_en: string
  name_ar: string
  title_en: string
  title_ar: string
  parent: NetworkOpsCategoryParentSummary | null
  assignments_count: number
}

export type NetworkOpsCategoryAssignmentMatrix = NetworkOpsCategory & {
  title_en: string
  title_ar: string
  assignments: NetworkOpsTeamAssignment[]
  assignments_count: number
}

export type NetworkOpsTeamDetailsMember = {
  assignment_id: number
  user_id: number
  full_name: string
  email: string | null
  phone: string | null
  job_title?: string | null
}

export type NetworkOpsTeamDetailsLevel = {
  id: number
  code: string
  name_en: string
  name_ar: string
  note_en: string | null
  note_ar: string | null
  sort_order: number
  members: NetworkOpsTeamDetailsMember[]
}

export type NetworkOpsTeamsDetailsCard = {
  id: number
  code: string
  name_en: string
  name_ar: string
  title_en: string
  title_ar: string
  parent: NetworkOpsCategoryParentSummary | null
  members_count: number
  levels: NetworkOpsTeamDetailsLevel[]
}

export type NetworkOpsLevelListParams = ListQueryParams & {
  active_only?: boolean
}

export type NetworkOpsCategoryListParams = ListQueryParams & {
  category_type?: "parent" | "subcategory"
  active_status?: "active" | "inactive"
  roots_only?: boolean
  parent_id?: number | null
  active_only?: boolean
}

export type NetworkOpsCategoryStatistics = {
  total: number
  parents: number
  subcategories: number
  without_assignments: number
}

export type NetworkOpsTeamAssignmentStatistics = {
  total: number
  unique_users: number
  assigned_categories: number
  unassigned_categories: number
}

export type NetworkOpsTeamAssignmentListParams = ListQueryParams & {
  network_ops_category_id?: number
  network_ops_level_id?: number
  user_id?: number
}
