import type { BackendModuleConfig } from "@/components/backend-module-page";
export const ACTIVITY_CATEGORIES_PAGE_CONFIG: BackendModuleConfig = {
  title: "Kategori Aktivitas",
  description: "Kelola kategori aktivitas siswa.",
  emptyMessage: "Belum ada kategori aktivitas",
  display: "cards",
  backHref: "/activity-items",
  backLabel: "Kembali ke Jenis Aktivitas",
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
    { key: "name", title: "Nama kategori" },
    { key: "description", title: "Deskripsi" },
    { key: "color", title: "Warna" },
  ],
};
