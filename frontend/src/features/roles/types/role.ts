export type Permission = {
  id: number
  name: string
  module: string
  action: string
}

export type Role = {
  id: number
  name: string
  guard_name?: string
  is_system?: boolean
  permissions: string[]
  users_count?: number
  created_at: string | null
  updated_at: string | null
}

export type RolePayload = {
  name: string
}

export type SyncRolePermissionsPayload = {
  permissions: string[]
}

export const PERMISSION_ACTIONS = [
  "view",
  "create",
  "update",
  "delete",
  "export",
] as const

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number]
