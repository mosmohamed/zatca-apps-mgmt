export type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
  errors: Record<string, string[]> | null
}

export type PaginationMeta = {
  current_page: number
  per_page: number
  total: number
  last_page: number
  from: number | null
  to: number | null
}

export type PaginatedData<T> = {
  items: T[]
  pagination: PaginationMeta
}

export type ListQueryParams = {
  page?: number
  per_page?: number
  search?: string
  sort?: string
}
