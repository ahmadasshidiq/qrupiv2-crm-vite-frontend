import { fetchPaginated } from '@/lib/api/paginated'
import type { AttendanceRow } from './types'
export const fetchAttendances = (page: number, limit: number) => fetchPaginated<AttendanceRow>('/attendance-logs', page, limit)
