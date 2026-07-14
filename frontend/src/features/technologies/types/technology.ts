export const TECHNOLOGY_CATEGORIES = [
  "Frontend",
  "Backend",
  "Database",
  "Cloud",
  "Mobile",
  "Other",
] as const

export type TechnologyCategory = (typeof TECHNOLOGY_CATEGORIES)[number]

export type Technology = {
  id: number
  name: string
  category: TechnologyCategory | string
  description: string | null
  is_active: boolean
  created_at: string | null
  updated_at: string | null
  deleted_at?: string | null
}

export type TechnologyPayload = {
  name: string
  category: TechnologyCategory | string
  description?: string | null
  is_active?: boolean
}
