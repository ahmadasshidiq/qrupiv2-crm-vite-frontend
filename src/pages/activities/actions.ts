import { fetchPaginated } from '@/lib/api/paginated'
import type { ActivityRow } from './types'
export const fetchActivities = (page: number, limit: number) => fetchPaginated<ActivityRow>('/activities', page, limit)
