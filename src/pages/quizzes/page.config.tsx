import type { BackendModuleConfig } from "@/components/backend-module-page";
import { Badge } from "@/components/ui/badge";

const quizTypeBadgeClass =
  "px-4 py-1 text-xs bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-900";

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
};
