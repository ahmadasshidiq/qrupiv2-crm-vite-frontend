import type { BackendModuleConfig } from "@/components/backend-module-page";
export const ABSENCE_REASONS_PAGE_CONFIG: BackendModuleConfig = {
  behaviorKey: "Alasan Ketidakhadiran",
  title: "Alasan ketidakhadiran",
  description: "Kelola pilihan alasan izin dan ketidakhadiran.",
  emptyMessage: "Belum ada alasan ketidakhadiran",
  backHref: "/attendances?category=student",
  backLabel: "Kembali",
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
  fields: [
    { key: "name", title: "Alasan" },
    { key: "description", title: "Deskripsi" },
    { key: "created_at", title: "Dibuat", type: "date" },
    { key: "updated_at", title: "Diperbarui", type: "date" },
  ],
};
