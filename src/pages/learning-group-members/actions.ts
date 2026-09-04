import { fetchPaginated } from '@/lib/api/paginated'
import type { LearningGroupMemberRow } from './types'
export const fetchLearningGroupMembers = (page: number, limit: number) => fetchPaginated<LearningGroupMemberRow>('/learning-group-members', page, limit)
