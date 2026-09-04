import { fetchPaginated } from '@/lib/api/paginated'
import type { QuizSessionRow } from './types'
export const fetchQuizSessions = (page: number, limit: number) => fetchPaginated<QuizSessionRow>('/quiz-sessions', page, limit)
