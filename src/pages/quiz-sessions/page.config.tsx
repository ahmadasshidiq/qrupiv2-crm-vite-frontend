/* eslint-disable react-refresh/only-export-components */
import type { BackendModuleConfig } from "@/components/backend-module-page";
import type { ApiRecordDto } from "@/lib/dto/api";
import { Badge } from "@/components/ui/badge";
import { Podium } from "lucide-react";

const positiveBadgeClass =
  "px-4 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900";
const negativeBadgeClass =
  "px-4 py-1 text-xs font-bold bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900";
const progressBadgeClass =
  "px-4 py-1 text-xs font-bold bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900";

function statusBadge(value: unknown) {
  const status = String(value ?? "").toLowerCase();
  const labels: Record<string, string> = {
    submitted: "Submitted",
    in_progress: "In Progress",
    timeout: "Timeout",
    failed: "Failed",
  };

  return (
    <Badge
      className={
        status === "submitted"
          ? positiveBadgeClass
          : status === "in_progress"
            ? progressBadgeClass
            : negativeBadgeClass
      }
    >
      {labels[status] ?? String(value ?? "-")}
    </Badge>
  );
}

function scoreBadge(value: unknown) {
  const score = Number(value ?? 0);
  return <Badge className={score > 0 ? positiveBadgeClass : negativeBadgeClass}>{score}</Badge>;
}

function formatSessionDate(value: unknown) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(String(value)));
}

function QuizSessionDetails({ record }: { record: ApiRecordDto }) {
  const quiz = record.quiz as ApiRecordDto | undefined;
  const user = record.user as ApiRecordDto | undefined;
  const answers = Array.isArray(record.answers) ? record.answers : [];
  const questions = Array.isArray(quiz?.quiz_questions) ? quiz.quiz_questions : [];
  const info = [
    ["Peserta", user?.name ?? record.user_name],
    ["Email", user?.email],
    ["Kuis", quiz?.title ?? record.quiz_title],
    ["Status", record.status],
    ["Nilai", record.score],
    ["Mulai", formatSessionDate(record.start_time)],
    ["Selesai", formatSessionDate(record.end_time)],
    ["Durasi kuis", quiz?.duration_minutes ? `${quiz.duration_minutes} menit` : "-"],
    ["Peringatan kecurangan", record.cheating_count ?? 0],
    ["Dibuat", formatSessionDate(record.created_at)],
  ];
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-base font-semibold">Ringkasan Sesi</h3>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {info.map(([label, value]) => (
            <div key={String(label)} className="rounded-xl bg-zinc-50 p-4 dark:bg-white/5">
              <dt className="text-xs text-zinc-500">{String(label)}</dt>
              <dd className="mt-1 break-words text-sm font-medium">{String(value ?? "-")}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div>
        <h3 className="mb-3 text-base font-semibold">Jawaban Peserta</h3>
        <div className="grid gap-3">
          {answers.length === 0 ? <p className="text-sm text-zinc-500">Belum ada jawaban.</p> : answers.map((answer, index) => {
            const item = answer && typeof answer === "object" ? answer as ApiRecordDto : {};
            const questionId = String(item.question_id ?? `question-${index + 1}`);
            const questionIndex = Number(questionId.replace("question-", "")) - 1;
            const question = questions[questionIndex] as ApiRecordDto | undefined;
            const questionText = String(question?.question_text ?? `Soal ${index + 1}`).replace(/^\s*\d+[.)]\s*/, "");
            const typeLabels: Record<string, string> = { multiple_choice: "Pilihan ganda", true_false: "Benar / Salah", fill_blank: "Isian", essay: "Essay" };
            const options = Array.isArray(question?.options) ? question.options : [];
            return (
              <div key={`${questionId}-${index}`} className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                <p className="text-sm font-semibold">{index + 1}. {questionText}</p>
                <p className="mt-1 text-xs text-zinc-500">{typeLabels[String(question?.type)] ?? "Tipe soal"}</p>
                {options.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{options.map((option, optionIndex) => { const choice = option && typeof option === "object" ? option as ApiRecordDto : {}; return <span key={optionIndex} className={`rounded-md border px-2 py-1 text-xs ${String(choice.value) === String(question?.correct_answer) ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300" : "border-slate-200 text-zinc-500 dark:border-white/10"}`}>{String(choice.value ?? "-")}. {String(choice.label ?? "-")}</span>; })}</div> : <p className="mt-2 text-xs text-zinc-500">Jawaban acuan: {String(question?.correct_answer ?? "-")}</p>}
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500">
                  <span>Jawaban: <strong className="text-zinc-800 dark:text-zinc-200">{String(item.selected_answer ?? "-")}</strong></span>
                  <span>Poin: <strong className="text-zinc-800 dark:text-zinc-200">{String(item.points_earned ?? 0)}</strong></span>
                  <span>{item.is_correct ? "Benar" : "Salah"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><h3 className="mb-2 text-sm font-semibold">Deskripsi Kuis</h3><p className="text-sm text-zinc-600 dark:text-zinc-300">{String(quiz?.description ?? "-")}</p></div>
        <div><h3 className="mb-2 text-sm font-semibold">Informasi Perangkat</h3><p className="break-words text-xs text-zinc-500">{String(record.device_info ?? "-")}</p></div>
      </div>
    </div>
  );
}
export const QUIZ_SESSIONS_PAGE_CONFIG: BackendModuleConfig = {
  title: "Riwayat Sesi & Nilai",
  behaviorKey: "Riwayat Sesi & Nilai",
  description: "Pantau pelaksanaan dan hasil sesi kuis.",
  emptyMessage: "Belum ada sesi kuis",
  headerAction: {
    label: "Ranking Siswa",
    icon: Podium,
    href: "/quiz-sessions/rankings",
  },
  actions: {
    view: true,
    create: true,
    edit: true,
    archive: true,
    delete: true,
    filter: true,
    import: false,
    export: true,
  },
  fields: [
    { key: "quiz_title", title: "Kuis" },
    { key: "user_name", title: "Peserta" },
    { key: "learning_group_name", title: "Grup belajar" },
    { key: "status", title: "Status", formatter: statusBadge },
    { key: "score", title: "Nilai", formatter: scoreBadge },
    {
      key: "cheating_count",
      title: "Peringatan",
      formatter: (value) => {
        const warningCount = Number(value ?? 0);
        if (warningCount === 0) return "-";

        return <Badge className={negativeBadgeClass}>{warningCount}</Badge>;
      },
    },
  ],
  detailRenderer: (record) => <QuizSessionDetails record={record} />,
};
