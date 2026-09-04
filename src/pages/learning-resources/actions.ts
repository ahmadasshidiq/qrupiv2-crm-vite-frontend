import { fetchPaginated } from '@/lib/api/paginated'
import type { LearningResourceRow } from './types'
export const fetchLearningResources = (page: number, limit: number) => fetchPaginated<LearningResourceRow>('/learning-resources', page, limit)
