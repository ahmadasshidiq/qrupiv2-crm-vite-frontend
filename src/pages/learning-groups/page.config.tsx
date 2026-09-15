import type { BackendModuleConfig } from "@/components/backend-module-page";
import { Badge } from "@/components/ui/badge";
import { LearningGroupDetailTabs } from "./components/learning-group-detail-tabs";
export const LEARNING_GROUPS_PAGE_CONFIG: BackendModuleConfig = {
  title: "Grup Pembelajaran",
  description:
    "Kelola kelas, mata pelajaran, mata kuliah, dan komunitas belajar.",
  emptyMessage: "Belum ada grup pembelajaran",
  editableFields: [
    { key: "institution_id", label: "ID institusi", type: "hidden" },
    {
      key: "name",
      label: "Nama grup pembelajaran",
      required: true,
      placeholder: "Contoh: Kelas 6A atau Matematika Dasar",
    },
    {
      key: "code",
      label: "Kode",
      required: true,
      placeholder: "Contoh: 6A-2026",
    },
    {
      key: "type",
      label: "Tipe grup pembelajaran",
      required: true,
      options: [
        { label: "Kelas sekolah", value: "school-class" },
        { label: "Kelas kuliah", value: "university-class" },
        { label: "Klub / komunitas", value: "club" },
      ],
      helperText:
        "Pilih tipe yang paling sesuai dengan konteks pembelajaran institusi.",
    },
    {
      key: "level",
      label: "Level / tingkat",
      type: "number",
      required: true,
      placeholder: "Contoh: 6",
      helperText:
        "Wajib berupa angka. Gunakan 0 bila grup tidak memiliki tingkatan.",
    },
    {
      key: "department",
      label: "Program / mata pelajaran",
      placeholder: "Contoh: Matematika atau Teknik Informatika",
    },
    {
      key: "major",
      label: "Peminatan",
      placeholder: "Contoh: IPA",
    },
    {
      key: "academic_year",
      label: "Tahun ajaran",
      placeholder: "Contoh: 2026/2027",
    },
    {
      key: "status",
      label: "Status",
      required: true,
      options: [
        { label: "Aktif", value: "active" },
        { label: "Tidak Aktif", value: "inactive" },
      ],
    },
  ],
  actions: {
    view: true,
    create: true,
    edit: true,
    archive: true,
    delete: true,
    filter: true,
    import: true,
    export: true,
  },
  detailRenderer: (group) =>
    group.id ? <LearningGroupDetailTabs groupId={String(group.id)} /> : null,
  fields: [
    { key: "institution_name", title: "Institusi" },
    { key: "name", title: "Nama grup" },
    { key: "code", title: "Kode" },
    { key: "level", title: "Tingkat" },
    { key: "department", title: "Program/mapel" },
    { key: "academic_year", title: "Tahun ajaran" },
    {
      key: "status",
      title: "Status",
      formatter: (value) => (
        <Badge
          className={
            value
              ? "px-4 py-0 bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900"
              : "px-4 py-0 bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/10"
          }
        >
          {value === "active" ? "Aktif" : "Tidak aktif"}
        </Badge>
      ),
    },
  ],
};
