import { apiRequest } from '@/lib/api/client'
import type { ApiListResponseDto, ApiRecordDto } from '@/lib/dto/api'

export type PaginatedResult<T = ApiRecordDto> = { items: T[]; total: number }

export async function fetchPaginated<T = ApiRecordDto>(endpoint: string, page: number, limit: number): Promise<PaginatedResult<T>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), sortOrder: 'desc' })
  const payload = await apiRequest<ApiListResponseDto<T>>(`${endpoint}?${params}`)
  const nested = payload.data && !Array.isArray(payload.data) ? payload.data : null
  const items = Array.isArray(payload.data) ? payload.data : nested?.data ?? nested?.items ?? payload.items ?? []
  const total = payload.total ?? nested?.total ?? nested?.meta?.totalData ?? nested?.meta?.total ?? payload.meta?.totalData ?? payload.meta?.total ?? items.length
  return { items, total }
}
