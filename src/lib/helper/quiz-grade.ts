export type QuizGradeComponent = "homework" | "quiz" | "midterm" | "final";

export type QuizGradeWeights = Record<QuizGradeComponent, number>;

export const QUIZ_GRADE_COMPONENTS: Array<{ key: QuizGradeComponent; label: string }> = [
  { key: "homework", label: "Tugas" },
  { key: "quiz", label: "Kuis" },
  { key: "midterm", label: "UTS" },
  { key: "final", label: "UAS" },
];

export const DEFAULT_QUIZ_GRADE_WEIGHTS: QuizGradeWeights = {
  homework: 20,
  quiz: 20,
  midterm: 30,
  final: 30,
};

/** Session statuses whose score counts as a finished attempt. Anything else scores 0. */
export const FINISHED_QUIZ_STATUSES = ["submitted", "timeout"];

export function toGradeComponent(type: unknown): QuizGradeComponent {
  const value = String(type ?? "").toLowerCase();
  return QUIZ_GRADE_COMPONENTS.some((component) => component.key === value)
    ? (value as QuizGradeComponent)
    : "quiz";
}

export function getGradeComponentLabel(type: unknown) {
  const key = toGradeComponent(type);
  return QUIZ_GRADE_COMPONENTS.find((component) => component.key === key)?.label ?? "Kuis";
}

export function getQuizMaxPoints(questions: Array<{ points?: number }> = []) {
  return questions.reduce((total, question) => total + Math.max(Number(question.points ?? 0), 0), 0);
}

/** Converts raw session points to a 0-100 scale. */
export function normalizeQuizScore(rawScore: number, maxPoints: number) {
  if (maxPoints <= 0) return Math.min(Math.max(rawScore, 0), 100);
  return Math.min(Math.max((rawScore / maxPoints) * 100, 0), 100);
}

export function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

/**
 * Share (0-1) of each component in the final grade. Components without any
 * quiz are skipped and the remaining weights are rescaled to 100%.
 */
export function getEffectiveWeights(
  componentAverages: Partial<Record<QuizGradeComponent, number | null>>,
  weights: QuizGradeWeights,
) {
  const active = QUIZ_GRADE_COMPONENTS.filter(
    ({ key }) => componentAverages[key] != null && Math.max(weights[key] ?? 0, 0) > 0,
  );
  const usedWeight = active.reduce((total, { key }) => total + weights[key], 0);
  return Object.fromEntries(
    active.map(({ key }) => [key, weights[key] / usedWeight]),
  ) as Partial<Record<QuizGradeComponent, number>>;
}

export function calculateFinalGrade(
  componentAverages: Partial<Record<QuizGradeComponent, number | null>>,
  weights: QuizGradeWeights,
) {
  const shares = Object.entries(getEffectiveWeights(componentAverages, weights)) as Array<[QuizGradeComponent, number]>;
  if (shares.length === 0) return null;
  return shares.reduce((total, [key, share]) => total + (componentAverages[key] ?? 0) * share, 0);
}

export function getGradePredicate(score: number | null) {
  if (score == null) return "-";
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "E";
}

export function formatGrade(score: number | null) {
  return score == null ? "-" : score.toLocaleString("id-ID", { maximumFractionDigits: 1 });
}
