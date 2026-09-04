import { apiRequest } from '@/lib/api/client'
import type { ApiRecordDto } from '@/lib/dto/api'

export async function fetchResourceById(endpoint: string, id: string) {
  const response = await apiRequest<{ data: ApiRecordDto }>(`${endpoint}/${id}`)
  return response.data
}

export async function updateResource(endpoint: string, id: string, values: Record<string, unknown>, multipart = false) {
  const body = multipart ? Object.entries(values).reduce((form, [key, value]) => {
    if (value !== '' && value !== undefined && value !== null) form.append(key, String(value))
    return form
  }, new FormData()) : values
  return apiRequest(`${endpoint}/${id}`, { method: 'PUT', body })
}

export function archiveResource(endpoint: string, id: string) {
  return apiRequest(`${endpoint}/${id}/archived`, { method: 'DELETE' })
}
