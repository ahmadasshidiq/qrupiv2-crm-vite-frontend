import { fetchPaginated, type PaginationFilters } from "@/lib/api/paginated";
import type { LearningResourceRow } from "./types";
export const fetchLearningResources = (
  page: number,
  limit: number,
  filters?: PaginationFilters,
) =>
  fetchPaginated<LearningResourceRow>(
    "/learning-resources",
    page,
    limit,
    filters,
  );
