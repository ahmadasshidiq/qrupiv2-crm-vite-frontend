import { apiRequest } from "@/lib/api/client";
import { fetchPaginated, type PaginationFilters } from "@/lib/api/paginated";
import type { QuizRankingResponseDto } from "@/lib/dto/quiz-ranking";
import type { QuizSessionRow } from "./types";
export const fetchQuizSessions = (
  page: number,
  limit: number,
  filters?: PaginationFilters,
) => fetchPaginated<QuizSessionRow>("/quiz-sessions", page, limit, filters);

export type QuizRankingFilters = {
  scope: "school" | "class";
  learning_group_id?: string;
  quiz_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
};

export async function fetchQuizRankings(filters: QuizRankingFilters) {
  const params = new URLSearchParams({ scope: filters.scope });
  Object.entries(filters).forEach(([key, value]) => {
    if (key !== "scope" && value !== undefined && value !== "") params.set(key, String(value));
  });
  const response = await apiRequest<{ data: QuizRankingResponseDto }>(`/quiz-sessions/rankings?${params.toString()}`);
  return response.data;
}
