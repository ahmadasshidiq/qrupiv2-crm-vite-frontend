import { fetchPaginated, type PaginationFilters } from "@/lib/api/paginated";
import type { LearningGroupMemberRow } from "./types";
export const fetchLearningGroupMembers = (
  page: number,
  limit: number,
  filters?: PaginationFilters,
) =>
  fetchPaginated<LearningGroupMemberRow>(
    "/learning-group-members",
    page,
    limit,
    filters,
  );
