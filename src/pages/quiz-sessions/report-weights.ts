import { getAuthUser } from "@/lib/auth/session";
import {
  DEFAULT_QUIZ_GRADE_WEIGHTS,
  QUIZ_GRADE_COMPONENTS,
  type QuizGradeWeights,
} from "@/lib/helper/quiz-grade";

const storageKey = () => `quiz-report-weights:${getAuthUser()?.id ?? "guest"}`;

/** Each teacher keeps their own last-used weights on this device. */
export function loadQuizReportWeights(): QuizGradeWeights {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey()) ?? "null") as Partial<QuizGradeWeights> | null;
    if (!stored) return DEFAULT_QUIZ_GRADE_WEIGHTS;
    return Object.fromEntries(
      QUIZ_GRADE_COMPONENTS.map(({ key }) => [key, Math.max(Number(stored[key] ?? 0), 0)]),
    ) as QuizGradeWeights;
  } catch {
    return DEFAULT_QUIZ_GRADE_WEIGHTS;
  }
}

export function saveQuizReportWeights(weights: QuizGradeWeights) {
  localStorage.setItem(storageKey(), JSON.stringify(weights));
}
