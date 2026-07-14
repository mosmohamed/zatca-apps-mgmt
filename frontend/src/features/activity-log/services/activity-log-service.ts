import { api } from "@/lib/axios"
import type { ApiEnvelope, PaginatedData } from "@/types/api"
import type {
  ActivityLogEntry,
  ActivityLogFilters,
  ActivityLogStats,
  ActivityStatItem,
} from "@/features/activity-log/types/activity-log"

type BackendActivityEntry = {
  id: number
  log_name: string | null
  description: string
  event: string | null
  subject_type: string | null
  subject_id: number | null
  subject_label: string | null
  causer?: {
    id: number
    full_name: string
    email?: string
  } | null
  properties?: {
    old?: Record<string, unknown>
    attributes?: Record<string, unknown>
  } | null
  created_at: string | null
}

type BackendStatItem = {
  id?: number
  user_id?: number
  subject_id?: number
  name: string
  count?: number
  activity_count?: number
}

function mapEntry(entry: BackendActivityEntry): ActivityLogEntry {
  return {
    id: entry.id,
    log_name: entry.log_name,
    description: entry.description,
    event: entry.event,
    causer: entry.causer
      ? {
          id: entry.causer.id,
          name: entry.causer.full_name,
        }
      : null,
    subject:
      entry.subject_id !== null && entry.subject_type
        ? {
            id: entry.subject_id,
            type: entry.subject_type,
            label: entry.subject_label ?? String(entry.subject_id),
          }
        : null,
    properties: entry.properties ?? null,
    created_at: entry.created_at,
  }
}

function mapStat(item: BackendStatItem): ActivityStatItem {
  return {
    id: item.id ?? item.user_id ?? item.subject_id ?? 0,
    name: item.name,
    count: item.count ?? item.activity_count ?? 0,
  }
}

function toQuery(filters: ActivityLogFilters): Record<string, string | number> {
  const query: Record<string, string | number> = {
    page: filters.page ?? 1,
    per_page: filters.per_page ?? 15,
  }

  if (filters.causer?.trim()) {
    query.search = filters.causer.trim()
  }
  if (filters.subject_type?.trim()) {
    query.subject_type = filters.subject_type.trim()
  }
  if (filters.date_from) {
    query.date_from = filters.date_from
  }
  if (filters.date_to) {
    query.date_to = filters.date_to
  }

  return query
}

export const activityLogService = {
  async list(
    filters: ActivityLogFilters = {}
  ): Promise<PaginatedData<ActivityLogEntry>> {
    const { data } = await api.get<
      ApiEnvelope<PaginatedData<BackendActivityEntry>>
    >("/activity-logs", { params: toQuery(filters) })

    return {
      items: data.data.items.map(mapEntry),
      pagination: data.data.pagination,
    }
  },

  async stats(): Promise<ActivityLogStats> {
    const { data } = await api.get<
      ApiEnvelope<{
        most_active_admins: BackendStatItem[]
        most_modified_applications: BackendStatItem[]
        top_vendors: BackendStatItem[]
      }>
    >("/activity-logs/stats")

    return {
      most_active_admins: (data.data.most_active_admins ?? []).map(mapStat),
      most_modified_applications: (
        data.data.most_modified_applications ?? []
      ).map(mapStat),
      top_vendors: (data.data.top_vendors ?? []).map(mapStat),
    }
  },
}
