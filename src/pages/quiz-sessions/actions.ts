import { apiRequest } from "@/lib/api/client";
import { fetchPaginated, type PaginationFilters } from "@/lib/api/paginated";
import type { QuizRankingResponseDto } from "@/lib/dto/quiz-ranking";
import type {
  QuizReportMemberDto,
  QuizReportQuizDto,
  QuizReportSessionDto,
} from "@/lib/dto/quiz-report";
import type { QuizReportSource } from "./report-data";
import type { QuizReportFilter, QuizSessionRow } from "./types";
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

const REPORT_LIMIT = 5000;

function monthEndDate(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return `${month}-${String(new Date(year, monthNumber, 0).getDate()).padStart(2, "0")}`;
}

export async function fetchQuizReportSource(filter: QuizReportFilter): Promise<QuizReportSource> {
  const groupFilter = filter.learningGroupId ? { "q.learning_group_id": filter.learningGroupId } : {};
  const periodFilter = {
    "q.start_time.gte": `${filter.from}-01 00:00:00`,
    "q.start_time.lte": `${monthEndDate(filter.to)} 23:59:59`,
  };
  const [quizzes, sessions, members] = await Promise.all([
    fetchPaginated<QuizReportQuizDto>("/quizzes", 1, REPORT_LIMIT, { ...periodFilter, ...groupFilter }),
    fetchPaginated<QuizReportSessionDto>("/quiz-sessions", 1, REPORT_LIMIT, { ...periodFilter, ...groupFilter }),
    fetchPaginated<QuizReportMemberDto>("/learning-group-members", 1, REPORT_LIMIT, {
      "u.type": "student",
      ...(filter.learningGroupId ? { "lgm.learning_group_id": filter.learningGroupId } : {}),
    }),
  ]);
  const studentFilter = <T extends { user_id: string }>(items: T[]) =>
    filter.studentId ? items.filter((item) => item.user_id === filter.studentId) : items;
  return {
    quizzes: quizzes.items,
    sessions: studentFilter(sessions.items),
    members: studentFilter(members.items),
  };
}

export const fetchLearningGroupStudents = (learningGroupId: string) =>
  fetchPaginated<QuizReportMemberDto>("/learning-group-members", 1, REPORT_LIMIT, {
    "u.type": "student",
    "lgm.learning_group_id": learningGroupId,
  });
