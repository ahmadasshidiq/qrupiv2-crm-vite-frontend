import { fetchPaginated } from '@/lib/api/paginated'
import type { ActivityCategoryRow } from './types'
export const fetchActivityCategories = (page: number, limit: number) => fetchPaginated<ActivityCategoryRow>('/activity-categories', page, limit)
