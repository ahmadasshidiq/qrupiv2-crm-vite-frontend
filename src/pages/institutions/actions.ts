import { fetchPaginated } from '@/lib/api/paginated'
import type { InstitutionRow } from './types'
export const fetchInstitutions = (page: number, limit: number) => fetchPaginated<InstitutionRow>('/institutions', page, limit)
