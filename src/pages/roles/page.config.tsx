import type { BackendModuleConfig } from "@/components/backend-module-page";
export const ROLES_PAGE_CONFIG: BackendModuleConfig = {
  title: "Role & Izin",
  description: "Atur role dan permission pengguna CRM.",
  emptyMessage: "Belum ada role",
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
    { key: "name", title: "Nama role" },
    { key: "description", title: "Deskripsi" },
    { key: "updated_at", title: "Diperbarui", type: "date" },
  ],
};
