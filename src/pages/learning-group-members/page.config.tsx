import type { BackendModuleConfig } from "@/components/backend-module-page";
export const LEARNING_GROUP_MEMBERS_PAGE_CONFIG: BackendModuleConfig = {
  title: "Anggota grup",
  description: "Kelola anggota pada setiap grup belajar.",
  emptyMessage: "Belum ada anggota grup",
  actions: { view: true, create: true, edit: true, archive: true, delete: true, filter: true, import: true, export: true },
  fields: [
    { key: "user_name", title: "Nama" },
    { key: "user_email", title: "Email" },
    { key: "learning_group_name", title: "Grup belajar" },
    { key: "role_in_group", title: "Peran" },
    { key: "institution_name", title: "Institusi" },
  ],
};
