import type { ApiRecordDto } from "@/lib/dto/api";
export type QuizSessionRow = ApiRecordDto;
import type { QuizGradeComponent } from "@/lib/helper/quiz-grade";

export type QuizReportMode = "recap" | "transcript" | "quiz-result";

export type QuizReportFilter = {
  from: string;
  to: string;
  learningGroupId?: string;
  studentId?: string;
};

export type QuizTranscriptEntry = {
  quizId: string;
  title: string;
  component: QuizGradeComponent;
  date?: string;
  status: string;
  rawScore: number;
  maxPoints: number;
  score: number;
  cheatingCount: number;
};

export type StudentTranscript = {
  key: string;
  userId: string;
  name: string;
  learningGroupName: string;
  entries: QuizTranscriptEntry[];
  componentAverages: Partial<Record<QuizGradeComponent, number | null>>;
  finalScore: number | null;
  predicate: string;
};

export type QuizResultSummary = {
  quizId: string;
  title: string;
  component: QuizGradeComponent;
  date?: string;
  learningGroupName: string;
  maxPoints: number;
  participants: Array<{ name: string; status: string; rawScore: number; score: number; cheatingCount: number }>;
  finishedCount: number;
  average: number | null;
  highest: number | null;
  lowest: number | null;
};
