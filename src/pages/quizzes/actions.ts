import { fetchPaginated, type PaginationFilters } from "@/lib/api/paginated";
import type { QuizRow } from "./types";
export const fetchQuizzes = (
  page: number,
  limit: number,
  filters?: PaginationFilters,
) => fetchPaginated<QuizRow>("/quizzes", page, limit, filters);
