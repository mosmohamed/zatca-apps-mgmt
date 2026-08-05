import type { ListQueryParams } from "@/types/api"

export type InfraLevel = {
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

export type InfraLevelPayload = {
  name_en: string
  name_ar: string
  code: string
  note_en?: string | null
  note_ar?: string | null
  sort_order?: number
  is_active?: boolean
}

export type InfraCategoryParentSummary = {
  id: number
  name_en: string
  name_ar: string
  code: string
}

export type InfraCategory = {
  id: number
  parent_id: number | null
  name_en: string
  name_ar: string
  code: string
  description: string | null
  sort_order: number
  is_active: boolean
  parent?: InfraCategoryParentSummary | null
  children?: InfraCategory[]
  children_count?: number
  assignments_count?: number
  title_en?: string
  title_ar?: string
  assignments?: InfraTeamAssignment[]
  created_at: string | null
  updated_at: string | null
}

export type InfraCategoryPayload = {
  parent_id?: number | null
  name_en: string
  name_ar: string
  code: string
  description?: string | null
  sort_order?: number
  is_active?: boolean
}

export type InfraTeamAssignmentUser = {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string | null
}

export type InfraTeamAssignment = {
  id: number
  infra_category_id: number
  user_id: number
  infra_level_id: number
  sort_order: number
  category?: InfraCategory | null
  level?: InfraLevel | null
  user?: InfraTeamAssignmentUser | null
  created_at: string | null
  updated_at: string | null
}

export type InfraTeamAssignmentPayload = {
  infra_category_id: number
  users: Array<{
    user_id: number
    infra_level_id: number
    sort_order?: number
  }>
}

export type InfraTeamAssignmentUpdatePayload = {
  infra_category_id?: number
  user_id?: number
  infra_level_id?: number
  sort_order?: number
}

export type InfraCategoryAssignmentSummary = {
  id: number
  code: string
  name_en: string
  name_ar: string
  title_en: string
  title_ar: string
  parent: InfraCategoryParentSummary | null
  assignments_count: number
}

export type InfraCategoryAssignmentMatrix = InfraCategory & {
  title_en: string
  title_ar: string
  assignments: InfraTeamAssignment[]
  assignments_count: number
}

export type InfraTeamDetailsMember = {
  assignment_id: number
  user_id: number
  full_name: string
  email: string | null
  phone: string | null
  job_title?: string | null
}

export type InfraTeamDetailsLevel = {
  id: number
  code: string
  name_en: string
  name_ar: string
  note_en: string | null
  note_ar: string | null
  sort_order: number
  members: InfraTeamDetailsMember[]
}

export type InfraTeamsDetailsCard = {
  id: number
  code: string
  name_en: string
  name_ar: string
  title_en: string
  title_ar: string
  parent: InfraCategoryParentSummary | null
  members_count: number
  levels: InfraTeamDetailsLevel[]
}

export type InfraLevelListParams = ListQueryParams & {
  active_only?: boolean
}

export type InfraCategoryListParams = ListQueryParams & {
  category_type?: "parent" | "subcategory"
  active_status?: "active" | "inactive"
  roots_only?: boolean
  parent_id?: number | null
  active_only?: boolean
}

export type InfraCategoryStatistics = {
  total: number
  parents: number
  subcategories: number
  without_assignments: number
}

export type InfraTeamAssignmentStatistics = {
  total: number
  unique_users: number
  assigned_categories: number
  unassigned_categories: number
}

export type InfraTeamAssignmentListParams = ListQueryParams & {
  infra_category_id?: number
  infra_level_id?: number
  user_id?: number
}
