import { fetchPaginated } from '@/lib/api/paginated'
import type { AbsenceReasonRow } from './types'
export const fetchAbsenceReasons = (page: number, limit: number) => fetchPaginated<AbsenceReasonRow>('/attendance-absence-reasons', page, limit)
