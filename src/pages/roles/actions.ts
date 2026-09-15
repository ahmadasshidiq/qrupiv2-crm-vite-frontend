import { fetchPaginated, type PaginationFilters } from "@/lib/api/paginated";
import type { RoleRow } from "./types";
export const fetchRoles = (
  page: number,
  limit: number,
  filters?: PaginationFilters,
) => fetchPaginated<RoleRow>("/roles", page, limit, filters);
