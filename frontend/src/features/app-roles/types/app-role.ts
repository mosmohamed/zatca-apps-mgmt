export type AppRole = {
  id: number
  name: string
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
}

export type AppRolePayload = {
  name: string
  description?: string | null
  is_active?: boolean
  sort_order?: number
}
