import type { BackendModuleConfig } from "@/components/backend-module-page";
import type { AnnouncementAudience } from "@/lib/dto/announcement";

function toJakartaIso(value: unknown) {
  if (!value) return undefined;
  const localValue = String(value);
  return localValue.length === 16
    ? `${localValue}:00+07:00`
    : localValue;
}

export function getAnnouncementsPageConfig(
  role: string,
  userId?: string,
): BackendModuleConfig {
  const isSuperAdmin = role === "super_admin";
  const isInstructor = ["instructor", "teacher", "guru"].includes(role);
  const audiences: Array<{ label: string; value: AnnouncementAudience }> =
    isSuperAdmin
      ? [{ label: "Sistem", value: "system" }]
      : isInstructor
        ? [
            { label: "Grup pembelajaran", value: "learning_group" },
            { label: "User tertentu", value: "user" },
          ]
        : [
            { label: "Institusi saya", value: "institution" },
            { label: "Grup pembelajaran", value: "learning_group" },
            { label: "User tertentu", value: "user" },
          ];
  return {
    behaviorKey: "Pengumuman",
    endpoint: "/notifications/announcements",
    title: "Pengumuman",
    description: "Kirim pengumuman ke penerima yang sesuai.",
    emptyMessage: "Belum ada pengumuman.",
    actions: {
      view: true,
      create: true,
      filter: false,
      edit: false,
      delete: false,
    },
    createEndpoint: "/notifications/announcements",
    fields: [
      { key: "audience", title: "Tujuan penerima" },
      { key: "title", title: "Judul" },
      { key: "message", title: "Pesan", type: "html" },
      { key: "status", title: "Status" },
      { key: "created_at", title: "Dibuat", type: "date" },
    ],
    editableFields: [
      {
        key: "audience",
        label: "Tujuan penerima",
        options: audiences,
        required: true,
      },
      {
        key: "target_id",
        label: "Grup pembelajaran",
        type: "resource",
        resourceEndpoint: "/learning-groups",
        resourceFilters: isInstructor
          ? { member_user_id: userId, "lg.status": "active" }
          : { "lg.status": "active" },
        resourcePlaceholder: "Pilih grup pembelajaran",
        requiredWhen: { key: "audience", values: ["learning_group"] },
        visibleWhen: { key: "audience", values: ["learning_group"] },
      },
      {
        key: "target_id",
        label: "User tertentu",
        type: "resource",
        resourceEndpoint: "/users",
        resourceFilters: { "u.type.in": "student,teacher,staff,admin" },
        resourcePlaceholder: "Pilih user",
        requiredWhen: { key: "audience", values: ["user"] },
        visibleWhen: { key: "audience", values: ["user"] },
      },
      {
        key: "title",
        label: "Judul pengumuman",
        required: true,
        placeholder: "Masukkan judul pengumuman",
      },
      {
        key: "message",
        label: "Pesan",
        type: "rich-text",
        required: true,
        fullWidth: true,
        placeholder: "Masukkan isi pengumuman",
        helperText: "Masukkan informasi yang sesuai.",
      },
      {
        key: "send_at",
        label: "Jadwalkan pengiriman",
        type: "datetime-local",
        helperText: "Kosongkan untuk mengirim segera.",
      },
      {
        key: "repeat_type",
        label: "Pengulangan",
        options: [
          { label: "Tidak berulang", value: "none" },
          { label: "Harian", value: "daily" },
          { label: "Mingguan", value: "weekly" },
          { label: "Bulanan", value: "monthly" },
        ],
        required: true,
        helperText:
          "Pengulangan akan dilakukan sesuai jam pengumuman pertama dikirimkan.",
      },
      {
        key: "repeat_until",
        label: "Pengulangan sampai",
        type: "datetime-local",
        visibleWhen: {
          key: "repeat_type",
          values: ["daily", "weekly", "monthly"],
        },
      },
    ],
    createPayload: (values) => ({
      audience: values.audience,
      ...(values.target_id ? { target_id: values.target_id } : {}),
      title: values.title,
      message: values.message,
      repeat_type: String(values.repeat_type || "none"),
      ...(values.send_at ? { send_at: toJakartaIso(values.send_at) } : {}),
      ...(values.repeat_until
        ? { repeat_until: toJakartaIso(values.repeat_until) }
        : {}),
    }),
  };
}
