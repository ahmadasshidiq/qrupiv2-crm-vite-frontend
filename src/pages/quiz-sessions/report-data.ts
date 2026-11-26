import type {
  QuizReportMemberDto,
  QuizReportQuizDto,
  QuizReportSessionDto,
} from "@/lib/dto/quiz-report";
import {
  FINISHED_QUIZ_STATUSES,
  QUIZ_GRADE_COMPONENTS,
  average,
  calculateFinalGrade,
  getGradePredicate,
  getQuizMaxPoints,
  normalizeQuizScore,
  toGradeComponent,
  type QuizGradeWeights,
} from "@/lib/helper/quiz-grade";
import type { QuizResultSummary, QuizTranscriptEntry, StudentTranscript } from "./types";

export type QuizReportSource = {
  quizzes: QuizReportQuizDto[];
  sessions: QuizReportSessionDto[];
  members: QuizReportMemberDto[];
};

const sessionKey = (quizId: string, userId: string) => `${quizId}::${userId}`;
const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

function sortQuizzes(quizzes: QuizReportQuizDto[]) {
  return [...quizzes].sort((a, b) => String(a.start_time ?? "").localeCompare(String(b.start_time ?? "")));
}

function buildEntry(quiz: QuizReportQuizDto, session?: QuizReportSessionDto): QuizTranscriptEntry {
  const maxPoints = getQuizMaxPoints(quiz.quiz_questions);
  const finished = FINISHED_QUIZ_STATUSES.includes(String(session?.status ?? ""));
  const rawScore = finished ? Number(session?.score ?? 0) : 0;
  return {
    quizId: quiz.id,
    title: String(quiz.title ?? "Kuis"),
    component: toGradeComponent(quiz.type),
    date: quiz.start_time,
    status: session ? String(session.status ?? "-") : "not_started",
    rawScore,
    maxPoints,
    score: normalizeQuizScore(rawScore, maxPoints),
    cheatingCount: Number(session?.cheating_count ?? 0),
  };
}

/** Collects every student of the selected scope: group members plus anyone who has a session. */
function collectStudents({ quizzes, sessions, members }: QuizReportSource) {
  const quizGroup = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
  const students = new Map<string, { userId: string; name: string; groupId: string; groupName: string }>();
  const add = (userId: string, name: unknown, groupId: unknown, groupName: unknown) => {
    const key = `${userId}::${String(groupId ?? "")}`;
    if (!students.has(key))
      students.set(key, { userId, name: String(name ?? "-"), groupId: String(groupId ?? ""), groupName: String(groupName ?? "-") });
  };
  members.forEach((member) => add(member.user_id, member.user_name, member.learning_group_id, member.learning_group_name));
  sessions.forEach((session) => {
    const quiz = quizGroup.get(session.quiz_id);
    if (quiz) add(session.user_id, session.user_name, quiz.learning_group_id, quiz.learning_group_name);
  });
  return [...students.entries()];
}

export function buildStudentTranscripts(source: QuizReportSource, weights: QuizGradeWeights): StudentTranscript[] {
  const sessions = new Map(source.sessions.map((session) => [sessionKey(session.quiz_id, session.user_id), session]));
  const quizzes = sortQuizzes(source.quizzes);
  return collectStudents(source)
    .map(([key, student]) => {
      const entries = quizzes
        .filter((quiz) => String(quiz.learning_group_id ?? "") === student.groupId)
        .map((quiz) => buildEntry(quiz, sessions.get(sessionKey(quiz.id, student.userId))));
      const componentAverages = Object.fromEntries(
        QUIZ_GRADE_COMPONENTS.map(({ key: component }) => [
          component,
          average(entries.filter((entry) => entry.component === component).map((entry) => entry.score)),
        ]),
      );
      const finalScore = calculateFinalGrade(componentAverages, weights);
      return {
        key,
        userId: student.userId,
        name: student.name,
        learningGroupName: student.groupName,
        entries,
        componentAverages,
        finalScore,
        predicate: getGradePredicate(finalScore),
      };
    })
    .sort((a, b) => a.learningGroupName.localeCompare(b.learningGroupName) || byName(a, b));
}

export function buildQuizResults(source: QuizReportSource, transcripts: StudentTranscript[]): QuizResultSummary[] {
  return sortQuizzes(source.quizzes).map((quiz) => {
    const participants = transcripts
      .flatMap((student) =>
        student.entries
          .filter((entry) => entry.quizId === quiz.id)
          .map((entry) => ({ name: student.name, status: entry.status, rawScore: entry.rawScore, score: entry.score, cheatingCount: entry.cheatingCount })),
      )
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    const scores = participants.map((participant) => participant.score);
    return {
      quizId: quiz.id,
      title: String(quiz.title ?? "Kuis"),
      component: toGradeComponent(quiz.type),
      date: quiz.start_time,
      learningGroupName: String(quiz.learning_group_name ?? "-"),
      maxPoints: getQuizMaxPoints(quiz.quiz_questions),
      participants,
      finishedCount: participants.filter((participant) => FINISHED_QUIZ_STATUSES.includes(participant.status)).length,
      average: average(scores),
      highest: scores.length ? Math.max(...scores) : null,
      lowest: scores.length ? Math.min(...scores) : null,
    };
  });
}
