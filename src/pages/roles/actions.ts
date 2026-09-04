import { fetchPaginated } from '@/lib/api/paginated'
import type { RoleRow } from './types'
export const fetchRoles = (page: number, limit: number) => fetchPaginated<RoleRow>('/roles', page, limit)
