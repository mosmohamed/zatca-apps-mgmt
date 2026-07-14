export type SearchEntityType =
  | "applications"
  | "vendors"
  | "users"
  | "technologies"
  | "departments"

export type SearchResultItem = {
  id: number
  type: SearchEntityType
  title: string
  subtitle?: string | null
}

export type SearchResultGroup = {
  type: SearchEntityType
  items: SearchResultItem[]
}

export type SearchResponse = {
  query: string
  total: number
  groups: SearchResultGroup[]
}
