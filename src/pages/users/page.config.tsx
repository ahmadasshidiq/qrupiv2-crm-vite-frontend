import type { BackendModuleConfig } from "@/components/backend-module-page";
import { Badge } from "@/components/ui/badge";
import qrupiLogo from "@/assets/qrupi-logo.png";
export const USERS_PAGE_CONFIG: BackendModuleConfig = {
  behaviorKey: "Pengguna",
  title: "Pengguna",
  description: "Kelola guru, admin, staf, dan siswa.",
  emptyMessage: "Belum ada pengguna",
  multipart: true,
  editableFields: [
    {
      key: "name",
      label: "Nama lengkap",
      required: true,
      placeholder: "Masukkan nama pengguna",
    },
    {
      key: "type",
      label: "Tipe pengguna",
      required: true,
      options: [
        { label: "Guru", value: "teacher" },
        { label: "Admin", value: "admin" },
        { label: "Staf", value: "staff" },
        { label: "Siswa", value: "student" },
      ],
      helperText: "Tipe pengguna menentukan data kredensial yang perlu diisi.",
    },
    {
      key: "role_id",
      label: "Role",
      type: "role",
      required: true,
      helperText: "Cari role berdasarkan nama, lalu pilih dari daftar.",
    },
    { key: "institution_id", label: "ID institusi", type: "hidden" },
    {
      key: "email",
      label: "Email",
      type: "email",
      placeholder: "nama@institusi.id",
      visibleWhen: { key: "type", values: ["teacher", "admin", "staff"] },
      requiredWhen: { key: "type", values: ["teacher", "admin", "staff"] },
      helperText: "Wajib untuk guru, admin, dan staf.",
    },
    {
      key: "password",
      label: "Password",
      type: "password",
      placeholder: "Masukkan password",
      visibleWhen: { key: "type", values: ["teacher", "admin", "staff"] },
      requiredWhen: { key: "type", values: ["teacher", "admin", "staff"] },
      helperText: "Wajib saat membuat akun guru, admin, atau staf.",
    },
    {
      key: "pin",
      label: "PIN",
      type: "password",
      placeholder: "Masukkan PIN siswa",
      visibleWhen: { key: "type", values: ["student"] },
      requiredWhen: { key: "type", values: ["student"] },
      helperText: "Wajib saat membuat akun siswa.",
    },
    { key: "phone", label: "Telepon", placeholder: "Contoh: 0812 3456 7890" },
    {
      key: "context_type",
      label: "Tipe identitas",
      placeholder: "Contoh: NISN, NIP, NIK, dsb.",
    },
    {
      key: "context_code",
      label: "No. identitas",
      placeholder: "Contoh: 1234567890",
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
    {
      key: "file",
      label: "Upload foto profil",
      type: "file",
      accept: "image/*",
      helperText: "Opsional. Pilih foto profil pengguna.",
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
  fields: [
    {
      key: "avatar_url",
      title: "Foto",
      formatter: (value) => {
        const avatarUrl =
          typeof value === "string" && value.trim() && value !== "-"
            ? value
            : qrupiLogo;

        return (
          <span className="flex size-11 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-1.5 dark:border-white/10 dark:bg-white/[0.04]">
            <img
              src={avatarUrl}
              alt="Foto profil pengguna"
              className="size-full object-contain"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = qrupiLogo;
              }}
            />
          </span>
        );
      },
    },
    { key: "context_type", title: "Tipe identitas" },
    { key: "context_code", title: "No. identitas" },
    { key: "name", title: "Nama" },
    { key: "email", title: "Email" },
    { key: "barcode", title: "Barcode" },
    { key: "institution_name", title: "Institusi" },
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
