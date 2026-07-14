import { api } from "@/lib/axios"
import type { ApiEnvelope } from "@/types/api"
import type {
  SearchEntityType,
  SearchResponse,
  SearchResultItem,
} from "@/features/search/types/search"

type BackendSearchItem = {
  id: number
  title: string
  subtitle?: string | null
  url?: string
}

type BackendSearchResponse = {
  applications: BackendSearchItem[]
  users: BackendSearchItem[]
  vendors: BackendSearchItem[]
  departments: BackendSearchItem[]
}

function toGroup(
  type: SearchEntityType,
  items: BackendSearchItem[]
): { type: SearchEntityType; items: SearchResultItem[] } {
  return {
    type,
    items: items.map((item) => ({
      id: item.id,
      type,
      title: item.title,
      subtitle: item.subtitle ?? null,
    })),
  }
}

export const searchService = {
  async search(query: string): Promise<SearchResponse> {
    const { data } = await api.get<ApiEnvelope<BackendSearchResponse>>(
      "/search",
      { params: { query } }
    )

    const payload = data.data
    const groups = [
      toGroup("applications", payload.applications ?? []),
      toGroup("users", payload.users ?? []),
      toGroup("vendors", payload.vendors ?? []),
      toGroup("departments", payload.departments ?? []),
    ]

    return {
      query,
      total: groups.reduce((sum, group) => sum + group.items.length, 0),
      groups,
    }
  },
}
