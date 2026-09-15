import { fetchPaginated, type PaginationFilters } from "@/lib/api/paginated";
import type { ActivityCategoryRow } from "./types";
export const fetchActivityCategories = (
  page: number,
  limit: number,
  filters?: PaginationFilters,
) =>
  fetchPaginated<ActivityCategoryRow>(
    "/activity-categories",
    page,
    limit,
    filters,
  );
