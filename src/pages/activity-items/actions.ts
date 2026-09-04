import { fetchPaginated } from '@/lib/api/paginated'
import type { ActivityItemRow } from './types'
export const fetchActivityItems = (page: number, limit: number) => fetchPaginated<ActivityItemRow>('/activity-items', page, limit)
