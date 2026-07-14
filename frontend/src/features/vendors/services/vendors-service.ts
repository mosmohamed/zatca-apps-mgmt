import { api } from "@/lib/axios"
import type { ApiEnvelope, ListQueryParams, PaginatedData } from "@/types/api"
import type { Vendor, VendorPayload } from "@/features/vendors/types/vendor"

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

export const vendorsService = {
  async list(params: ListQueryParams = {}): Promise<PaginatedData<Vendor>> {
    const { data } = await api.get<ApiEnvelope<PaginatedData<Vendor>>>(
      "/vendors",
      { params: toQuery(params) }
    )
    return data.data
  },

  async create(payload: VendorPayload): Promise<Vendor> {
    const { data } = await api.post<ApiEnvelope<Vendor>>("/vendors", payload)
    return data.data
  },

  async update(id: number, payload: VendorPayload): Promise<Vendor> {
    const { data } = await api.put<ApiEnvelope<Vendor>>(
      `/vendors/${id}`,
      payload
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete<ApiEnvelope<null>>(`/vendors/${id}`)
  },
}
