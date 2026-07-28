import { api } from "@/lib/axios"
import type { ApiEnvelope, ListQueryParams, PaginatedData } from "@/types/api"
import type {
  Department,
  DepartmentPayload,
  DepartmentStatistics,
} from "@/features/departments/types/department"

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

export const departmentsService = {
  async list(params: ListQueryParams = {}): Promise<PaginatedData<Department>> {
    const { data } = await api.get<ApiEnvelope<PaginatedData<Department>>>(
      "/departments",
      { params: toQuery(params) }
    )
    return data.data
  },

  async create(payload: DepartmentPayload): Promise<Department> {
    const { data } = await api.post<ApiEnvelope<Department>>(
      "/departments",
      payload
    )
    return data.data
  },

  async update(id: number, payload: DepartmentPayload): Promise<Department> {
    const { data } = await api.put<ApiEnvelope<Department>>(
      `/departments/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/departments/${id}`)
  },

  async statistics(): Promise<DepartmentStatistics> {
    const { data } = await api.get<ApiEnvelope<DepartmentStatistics>>(
      "/departments/statistics"
    )
    return data.data
  },
}
