import type { BackendModuleConfig } from "@/components/backend-module-page";
import type { AnnouncementAudience } from "@/lib/dto/announcement";

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
    headerAction: { label: "Buat pengumuman", href: "/announcements/create" },
    createEndpoint: "/notifications/announcements",
    fields: [
      { key: "audience", title: "Tujuan penerima" },
      { key: "title", title: "Judul" },
      { key: "message", title: "Pesan" },
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
        type: "textarea",
        required: true,
        fullWidth: true,
        placeholder: "Masukkan isi pengumuman",
        helperText: "Masukkan informasi yang sesuai.",
      },
    ],
    createPayload: (values) => ({
      audience: values.audience,
      ...(values.target_id ? { target_id: values.target_id } : {}),
      title: values.title,
      message: values.message,
    }),
  };
}
