import { fetchPaginated, type PaginationFilters } from "@/lib/api/paginated";
import type { ActivityItemRow } from "./types";
export const fetchActivityItems = (
  page: number,
  limit: number,
  filters?: PaginationFilters,
) => fetchPaginated<ActivityItemRow>("/activity-items", page, limit, filters);
