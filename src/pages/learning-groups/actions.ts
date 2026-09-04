import { fetchPaginated } from '@/lib/api/paginated'
import type { LearningGroupRow } from './types'
export const fetchLearningGroups = (page: number, limit: number) => fetchPaginated<LearningGroupRow>('/learning-groups', page, limit)
