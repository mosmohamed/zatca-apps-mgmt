export type ActivityLogCauser = {
  id: number
  name: string
} | null

export type ActivityLogSubject = {
  id: number
  type: string
  label: string
} | null

export type ActivityLogEntry = {
  id: number
  log_name: string | null
  description: string
  event: string | null
  causer: ActivityLogCauser
  subject: ActivityLogSubject
  properties: {
    old?: Record<string, unknown>
    attributes?: Record<string, unknown>
  } | null
  created_at: string | null
}

export type ActivityLogFilters = {
  page?: number
  per_page?: number
  causer?: string
  subject_type?: string
  date_from?: string
  date_to?: string
}

export type ActivityStatItem = {
  id: number
  name: string
  count: number
}

export type ActivityLogStats = {
  most_active_admins: ActivityStatItem[]
  most_modified_applications: ActivityStatItem[]
  top_vendors: ActivityStatItem[]
}
