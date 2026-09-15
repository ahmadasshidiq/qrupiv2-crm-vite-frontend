import type { BackendModuleConfig } from "@/components/backend-module-page";
import { Tags } from "lucide-react";
export const ACTIVITY_ITEMS_PAGE_CONFIG: BackendModuleConfig = {
  title: "Jenis Aktivitas",
  description: "Atur jenis aktivitas, poin, dan batas periode.",
  emptyMessage: "Belum ada jenis aktivitas",
  display: "cards",
  editableFields: [
    {
      key: "name",
      label: "Nama aktivitas",
      required: true,
      placeholder: "Contoh: Menyelesaikan latihan Matematika",
    },
    {
      key: "category_id",
      label: "Kategori aktivitas",
      type: "activity-category",
      required: true,
      helperText: "Cari lalu pilih kategori untuk aktivitas ini.",
    },
    {
      key: "type",
      label: "Tipe aktivitas",
      required: true,
      fullWidth: true,
      options: [
        { label: "Aktivitas positif", value: "positive" },
        { label: "Pelanggaran", value: "violation" },
      ],
    },
    {
      key: "color",
      label: "Warna",
      type: "color",
      required: true,
      helperText: "Warna penanda aktivitas pada daftar dan laporan.",
    },
    {
      key: "description",
      label: "Deskripsi",
      type: "textarea",
      placeholder: "Jelaskan kriteria aktivitas ini.",
    },
    {
      key: "point_value",
      label: "Poin",
      type: "number",
      required: true,
      placeholder: "Contoh: 10",
      helperText: "Poin yang didapat setiap aktivitas dicatat.",
    },
    {
      key: "daily_limit",
      label: "Batas pencatatan per hari",
      type: "number",
      required: true,
      placeholder: "0 untuk tanpa batas",
      helperText:
        "Contoh: isi 1 agar aktivitas ini hanya dapat dicatat sekali dalam satu hari. Isi 0 jika tidak dibatasi.",
    },
    {
      key: "period_type",
      label: "Rentang batas tambahan",
      required: true,
      options: [
        { label: "Tidak ada batas tambahan", value: "none" },
        { label: "Harian", value: "daily" },
        { label: "Mingguan", value: "weekly" },
        { label: "Bulanan", value: "monthly" },
      ],
      helperText:
        "Pilih rentang waktu untuk membatasi total pencatatan, selain batas per hari.",
    },
    {
      key: "period_limit",
      label: "Maksimum pencatatan pada rentang",
      type: "number",
      required: true,
      placeholder: "0 untuk tanpa batas",
      helperText:
        "Contoh: rentang Bulanan dan nilai 3 berarti aktivitas maksimal dicatat 3 kali dalam satu bulan. Isi 0 jika tidak dibatasi.",
    },
    {
      key: "is_send_notif",
      label: "Kirim notifikasi",
      type: "boolean",
      required: true,
      options: [
        { label: "Kirim notifikasi", value: "true" },
        { label: "Jangan kirim notifikasi", value: "false" },
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
  toolbarActions: [
    {
      label: "Kelola Kategori",
      href: "/activity-categories",
      icon: Tags,
    },
  ],
  fields: [
    { key: "name", title: "Nama aktivitas" },
    { key: "type", title: "Tipe" },
    { key: "point_value", title: "Poin" },
    { key: "period_type", title: "Periode" },
  ],
};
