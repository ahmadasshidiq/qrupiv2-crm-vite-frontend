import { fetchPaginated, type PaginationFilters } from "@/lib/api/paginated";
import type { AbsenceReasonRow } from "./types";
export const fetchAbsenceReasons = (
  page: number,
  limit: number,
  filters?: PaginationFilters,
) =>
  fetchPaginated<AbsenceReasonRow>(
    "/attendance-absence-reasons",
    page,
    limit,
    filters,
  );
