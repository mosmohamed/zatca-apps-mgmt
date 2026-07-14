import { api } from "@/lib/axios"
import type { ApiEnvelope, ListQueryParams, PaginatedData } from "@/types/api"
import type {
  JobTitle,
  JobTitlePayload,
} from "@/features/job-titles/types/job-title"

function toQuery(params: ListQueryParams): Record<string, string | number> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    per_page: params.per_page ?? 15,
  }

  if (params.search?.trim()) {
    query.search = params.search.trim()
  }

  if (params.sort) {
    query.sort = params.sort
  }

  return query
}

export const jobTitlesService = {
  async list(params: ListQueryParams = {}): Promise<PaginatedData<JobTitle>> {
    const { data } = await api.get<ApiEnvelope<PaginatedData<JobTitle>>>(
      "/job-titles",
      { params: toQuery(params) }
    )
    return data.data
  },

  async create(payload: JobTitlePayload): Promise<JobTitle> {
    const { data } = await api.post<ApiEnvelope<JobTitle>>(
      "/job-titles",
      payload
    )
    return data.data
  },

  async update(id: number, payload: JobTitlePayload): Promise<JobTitle> {
    const { data } = await api.put<ApiEnvelope<JobTitle>>(
      `/job-titles/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/job-titles/${id}`)
  },
}
