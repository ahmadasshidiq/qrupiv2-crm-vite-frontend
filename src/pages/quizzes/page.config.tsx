/* eslint-disable react-refresh/only-export-components */
import type { BackendModuleConfig } from "@/components/backend-module-page";
import { Badge } from "@/components/ui/badge";
import type { ApiRecordDto } from "@/lib/dto/api";

const quizTypeBadgeClass =
  "px-4 py-1 text-xs bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-900";

function formatQuizDate(value: unknown) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(String(value)));
}

function QuizDetails({ record }: { record: ApiRecordDto }) {
  const group = record.learning_group as ApiRecordDto | undefined;
  const institution = record.institution as ApiRecordDto | undefined;
  const creator = record.created_user as ApiRecordDto | undefined;
  const questions = Array.isArray(record.quiz_questions) ? record.quiz_questions : [];
  const typeLabels: Record<string, string> = { quiz: "Kuis", homework: "Pekerjaan Rumah", midterm: "Ujian Tengah Semester", final: "Ujian Akhir Semester" };
  const info = [["Judul kuis", record.title], ["Tipe", typeLabels[String(record.type)] ?? record.type], ["Grup pembelajaran", group?.name ?? record.learning_group_name], ["Institusi", institution?.name], ["Dibuat oleh", creator?.name ?? record.created_user_name], ["Waktu mulai", formatQuizDate(record.start_time)], ["Waktu selesai", formatQuizDate(record.end_time)], ["Durasi pengerjaan", record.duration_minutes ? `${record.duration_minutes} menit` : "-"], ["Batas peringatan", record.max_cheating_warnings ?? 0], ["Penalti kecurangan", `${record.cheating_penalty_minutes ?? 0} menit`], ["Dibuat pada", formatQuizDate(record.created_at)], ["Diperbarui pada", formatQuizDate(record.updated_at)]];
  return <div className="space-y-6">
    <section><h3 className="mb-3 text-base font-semibold">Informasi Kuis</h3><p className="mb-4 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-700 dark:bg-white/5 dark:text-zinc-300">{String(record.description ?? "Tidak ada deskripsi.")}</p><dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{info.map(([label, value]) => <div key={String(label)} className="rounded-xl bg-zinc-50 p-4 dark:bg-white/5"><dt className="text-xs text-zinc-500">{String(label)}</dt><dd className="mt-1 break-words text-sm font-medium">{String(value ?? "-")}</dd></div>)}</dl></section>
    <section><div className="mb-3 flex items-center justify-between"><h3 className="text-base font-semibold">Daftar Soal</h3><span className="text-xs text-zinc-500">{questions.length} soal</span></div><div className="grid gap-4">{questions.map((question, index) => { const item = question && typeof question === "object" ? question as ApiRecordDto : {}; const options = Array.isArray(item.options) ? item.options : []; const questionText = String(item.question_text ?? "-").replace(/^\s*\d+[.)]\s*/, ""); const typeLabels: Record<string, string> = { multiple_choice: "Pilihan ganda", true_false: "Benar / Salah", fill_blank: "Isian", essay: "Essay" }; return <article key={index} className="rounded-xl border border-slate-200 p-4 dark:border-white/10"><div className="flex items-start justify-between gap-3"><div><h4 className="text-sm font-semibold">{index + 1}. {questionText}</h4><span className="text-xs font-normal text-zinc-500">{typeLabels[String(item.type)] ?? "Tipe soal"}</span></div><span className="shrink-0 text-xs text-zinc-500">{String(item.points ?? 0)} poin</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{options.length > 0 ? options.map((option, optionIndex) => { const choice = option && typeof option === "object" ? option as ApiRecordDto : {}; const isCorrect = String(choice.value ?? "") === String(item.correct_answer ?? ""); return <div key={optionIndex} className={`rounded-lg border px-3 py-2 text-sm ${isCorrect ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300" : "border-slate-200 dark:border-white/10"}`}><span className="font-semibold">{String(choice.value ?? "-")}.</span> {String(choice.label ?? "-")}{isCorrect ? <span className="ml-2 text-xs font-semibold">(Jawaban benar)</span> : null}</div>; }) : <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-white/10"><span className="font-semibold">Jawaban acuan:</span> {String(item.correct_answer || "Tidak ada")}</div>}</div></article>; })}</div></section>
  </div>;
}

export const QUIZZES_PAGE_CONFIG: BackendModuleConfig = {
  title: "Kuis",
  description: "Kelola soal dan kuis pembelajaran.",
  emptyMessage: "Belum ada kuis",
  editableFields: [
    {
      key: "title",
      label: "Judul kuis",
      required: true,
      placeholder: "Contoh: Kuis Matematika Bab 1",
    },
    {
      key: "learning_group_id",
      label: "Grup pembelajaran",
      type: "resource",
      resourceEndpoint: "/learning-groups",
      resourcePlaceholder: "Cari grup pembelajaran",
      required: true,
      helperText: "Pilih grup yang akan mengerjakan kuis ini.",
    },
    {
      key: "description",
      label: "Deskripsi",
      type: "textarea",
      fullWidth: true,
      placeholder: "Jelaskan tujuan atau petunjuk pengerjaan kuis.",
    },
    {
      key: "max_cheating_warnings",
      label: "Batas peringatan kecurangan",
      type: "number",
      required: true,
      placeholder: "Contoh: 3",
      helperText:
        "Jumlah peringatan sebelum penalti diterapkan. Isi 0 untuk menonaktifkan peringatan.",
    },
    {
      key: "cheating_penalty_minutes",
      label: "Penalti kecurangan (menit)",
      type: "number",
      required: true,
      placeholder: "Contoh: 5",
      helperText:
        "Jumlah menit yang dikurangi atau menjadi penalti setelah batas peringatan tercapai.",
    },
    {
      key: "start_time",
      label: "Waktu mulai",
      type: "datetime-local",
      required: true,
    },
    {
      key: "end_time",
      label: "Waktu selesai",
      type: "datetime-local",
      required: true,
    },
    {
      key: "duration_minutes",
      label: "Durasi pengerjaan (menit)",
      type: "number",
      required: true,
      placeholder: "Contoh: 30",
      helperText: "Tentukan waktu mulai dan selesai kuis, durasi akan dihitung otomatis.",
    },
    {
      key: "type",
      label: "Tipe kuis",
      options: [
        { label: "Kuis", value: "quiz" },
        { label: "Pekerjaan Rumah", value: "homework" },
        { label: "Ujian Tengah Semester", value: "midterm" },
        { label: "Ujian Akhir Semester", value: "final" },
      ],
      required: true,
    },
    {
      key: "quiz_questions",
      label: "Daftar soal",
      type: "quiz-questions",
      fullWidth: true,
      required: true,
      helperText:
        "Tambahkan pertanyaan, pilihan jawaban, jawaban benar, dan poin setiap soal.",
    },
    { key: "institution_id", label: "Institusi", type: "hidden" },
    { key: "created_user_id", label: "Pembuat", type: "hidden" },
  ],
  filterFields: [
    {
      key: "title.ilike",
      label: "Title",
      type: "text",
      placeholder: "Search quiz title",
    },
    {
      key: "type",
      label: "Type",
      type: "text",
      placeholder: "quiz / homework / midterm / final",
    },
  ],
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
    { key: "title", title: "Judul kuis" },
    { key: "learning_group_name", title: "Grup belajar" },
    {
      key: "type",
      title: "Tipe",
      formatter: (value) => (
        <Badge className={quizTypeBadgeClass}>
          {{
            quiz: "Kuis",
            homework: "Pekerjaan Rumah",
            midterm: "Ujian Tengah Semester",
            final: "Ujian Akhir Semester",
          }[String(value ?? "")] ?? String(value ?? "-")}
        </Badge>
      ),
    },
    { key: "duration_minutes", title: "Durasi (menit)" },
    { key: "quiz_count_question", title: "Jumlah soal" },
    { key: "created_user_name", title: "Dibuat oleh" },
  ],
  detailRenderer: (record) => <QuizDetails record={record} />,
};
