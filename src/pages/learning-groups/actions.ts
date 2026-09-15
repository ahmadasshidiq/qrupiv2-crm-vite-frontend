import { fetchPaginated, type PaginationFilters } from "@/lib/api/paginated";
import type { ApiRecordDto } from "@/lib/dto/api";
import type { LearningGroupRow } from "./types";
export const fetchLearningGroups = (
  page: number,
  limit: number,
  filters?: PaginationFilters,
) => fetchPaginated<LearningGroupRow>("/learning-groups", page, limit, filters);

export const fetchAvailableGroupMembers = (
  page: number,
  limit: number,
  filters?: PaginationFilters,
) => fetchPaginated<ApiRecordDto>("/users", page, limit, filters);
