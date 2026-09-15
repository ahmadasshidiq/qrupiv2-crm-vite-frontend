import { fetchPaginated, type PaginationFilters } from "@/lib/api/paginated";
import type { InstitutionRow } from "./types";
export const fetchInstitutions = (
  page: number,
  limit: number,
  filters?: PaginationFilters,
) => fetchPaginated<InstitutionRow>("/institutions", page, limit, filters);
