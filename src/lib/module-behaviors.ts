import type {
  BackendModuleConfig,
  ModuleFormField,
} from "@/components/backend-module-page";

type ModuleBehavior = {
  endpoint: string;
  multipart?: boolean;
  fields: ModuleFormField[];
};

const MODULE_BEHAVIORS: Record<string, ModuleBehavior> = {
  Pengguna: {
    endpoint: "/users",
    multipart: true,
    fields: [
      { key: "name", label: "Nama" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Telepon" },
      { key: "type", label: "Tipe" },
      { key: "status", label: "Status" },
    ],
  },
  Institusi: {
    endpoint: "/institutions",
    multipart: true,
    fields: [
      { key: "name", label: "Nama institusi" },
      { key: "phone", label: "Telepon" },
      { key: "address", label: "Alamat" },
      { key: "website", label: "Website" },
      { key: "status", label: "Status" },
    ],
  },
  "Role & Izin": {
    endpoint: "/roles",
    fields: [
      { key: "name", label: "Nama role" },
      { key: "description", label: "Deskripsi" },
    ],
  },
  "Grup Pembelajaran": {
    endpoint: "/learning-groups",
    fields: [
      { key: "name", label: "Nama grup" },
      { key: "code", label: "Kode" },
      { key: "level", label: "Tingkat", type: "number" },
      { key: "department", label: "Program/mapel" },
      { key: "academic_year", label: "Tahun ajaran" },
    ],
  },
  "Anggota Grup": {
    endpoint: "/learning-group-members",
    fields: [
      { key: "user_id", label: "ID pengguna" },
      { key: "learning_group_id", label: "ID grup belajar" },
      { key: "role_in_group", label: "Peran dalam grup" },
    ],
  },
  "Materi Belajar": {
    endpoint: "/learning-resources",
    multipart: true,
    fields: [
      { key: "title", label: "Judul" },
      { key: "description", label: "Deskripsi" },
      { key: "type", label: "Tipe" },
      { key: "file_url", label: "URL file" },
    ],
  },
  Kuis: {
    endpoint: "/quizzes",
    fields: [
      { key: "title", label: "Judul kuis" },
      { key: "description", label: "Deskripsi" },
      { key: "duration_minutes", label: "Durasi", type: "number" },
    ],
  },
  "Riwayat Sesi & Nilai": {
    endpoint: "/quiz-sessions",
    fields: [
      { key: "status", label: "Status" },
      { key: "score", label: "Nilai", type: "number" },
    ],
  },
  Absensi: {
    endpoint: "/attendance-logs",
    fields: [
      { key: "status", label: "Status" },
      { key: "type", label: "Tipe" },
      { key: "absence_note", label: "Catatan" },
    ],
  },
  "Alasan Ketidakhadiran": {
    endpoint: "/attendance-absence-reasons",
    fields: [
      {
        key: "name",
        label: "Nama alasan",
        placeholder: "Contoh: Sakit",
        helperText: "Masukkan alasan ketidakhadiran.",
      },
      { key: "description", label: "Deskripsi" },
      { key: "institution_id", label: "Institusi", type: "hidden" },
    ],
  },
  Aktivitas: {
    endpoint: "/activities",
    fields: [
      { key: "description", label: "Deskripsi" },
      { key: "point_value", label: "Poin", type: "number" },
      { key: "occurred_at", label: "Waktu", type: "datetime-local" },
      { key: "platform", label: "Platform" },
    ],
  },
  "Kategori Aktivitas": {
    endpoint: "/activity-categories",
    fields: [
      { key: "name", label: "Nama kategori" },
      { key: "description", label: "Deskripsi" },
      {
        key: "color",
        label: "Warna",
        type: "color",
        required: true,
        helperText: "Warna penanda kategori pada daftar dan jenis aktivitas.",
      },
    ],
  },
  "Jenis Aktivitas": {
    endpoint: "/activity-items",
    fields: [
      { key: "name", label: "Nama aktivitas" },
      { key: "description", label: "Deskripsi" },
      { key: "type", label: "Tipe" },
      { key: "point_value", label: "Poin", type: "number" },
      { key: "period_type", label: "Periode" },
    ],
  },
};

export function getModuleBehavior(config: BackendModuleConfig) {
  return MODULE_BEHAVIORS[config.behaviorKey ?? config.title];
}
