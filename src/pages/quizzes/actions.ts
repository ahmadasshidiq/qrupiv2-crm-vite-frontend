import { fetchPaginated } from '@/lib/api/paginated'
import type { QuizRow } from './types'
export const fetchQuizzes = (page: number, limit: number) => fetchPaginated<QuizRow>('/quizzes', page, limit)
