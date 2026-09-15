import type { BackendModuleConfig } from "@/components/backend-module-page";
import { truncateDescription } from "@/lib/helper/text";
import { ChartSpline } from "lucide-react";
export const ACTIVITIES_PAGE_CONFIG: BackendModuleConfig = {
  title: "Aktivitas",
  description: "Pantau aktivitas positif dan pelanggaran siswa.",
  emptyMessage: "Belum ada aktivitas",
  editableFields: [
    {
      key: "activity_item_id",
      label: "Jenis aktivitas",
      type: "resource",
      resourceEndpoint: "/activity-items",
      resourcePlaceholder: "Cari jenis aktivitas",
      required: true,
      helperText: "Pilih jenis aktivitas yang akan dicatat.",
    },
    {
      key: "user_id",
      label: "Siswa",
      type: "resource",
      resourceEndpoint: "/users",
      resourceFilters: { "u.type": "student" },
      resourcePlaceholder: "Cari siswa",
      required: true,
      helperText: "Pilih siswa yang menerima catatan aktivitas.",
    },
    {
      key: "learning_group_id",
      label: "Grup pembelajaran",
      type: "resource",
      resourceEndpoint: "/learning-groups",
      resourcePlaceholder: "Cari grup pembelajaran",
      required: true,
      helperText: "Pilih grup pembelajaran siswa saat aktivitas dicatat.",
    },
    {
      key: "occurred_at",
      label: "Waktu kejadian",
      type: "datetime-local",
      required: true,
      helperText: "Pilih tanggal dan waktu aktivitas terjadi.",
    },
    {
      key: "point_value",
      label: "Poin dicatat",
      type: "number",
      required: true,
      placeholder: "Contoh: 1",
      helperText: "Masukkan poin sesuai pencatatan yang dilakukan.",
    },
    {
      key: "platform",
      label: "Platform pencatatan",
      placeholder: "Contoh: CRM Admin, Web, Aplikasi Mobile",
      helperText: "Sumber atau platform tempat aktivitas dicatat.",
    },
    {
      key: "description",
      label: "Catatan",
      type: "textarea",
      placeholder: "Tambahkan catatan bila diperlukan.",
    },
    { key: "recorded_user_id", label: "Dicatat oleh", type: "hidden" },
  ],
  headerAction: {
    label: "Grafik Aktivitas",
    icon: ChartSpline,
    href: "/activities/chart",
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
    { key: "user_name", title: "Nama" },
    { key: "activity_item_name", title: "Aktivitas" },
    { key: "category_name", title: "Kategori" },
    { key: "learning_group_name", title: "Grup pembelajaran" },
    {
      key: "description",
      title: "Catatan",
      formatter: (value) => (
        <span className="block max-w-64" title={String(value ?? "")}>
          {truncateDescription(value)}
        </span>
      ),
    },
    {
      key: "point_value",
      title: "Poin",
      formatter: (value, record) => (
        <span
          className={
            record.activity_item_type === "positive"
              ? "px-3 py-2 bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900 rounded-full"
              : "px-4 py-2 bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900 rounded-full"
          }
        >
          +{value}
        </span>
      ),
    },
    { key: "occurred_at", title: "Waktu", type: "date" },
    { key: "recorded_user_name", title: "Dicatat oleh" },
  ],
};
