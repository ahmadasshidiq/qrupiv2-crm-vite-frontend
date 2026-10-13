import type { BackendModuleConfig } from "@/components/backend-module-page";
import { Badge } from "@/components/ui/badge";
import type { AnnouncementAudience } from "@/lib/dto/announcement";
import { truncateDescription } from "@/lib/helper/text";

function toUtcIso(value: unknown) {
  if (!value) return undefined;
  const localValue = String(value);
  return new Date(localValue).toISOString();
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
      edit: true,
      delete: true,
    },
    canEditRecord: (record) => record.status === "scheduled",
    createEndpoint: "/notifications/announcements",
    updateEndpoint: "/notifications/announcements",
    updateMethod: "PATCH",
    deleteEndpoint: "/notifications/announcements",
    fields: [
      { key: "audience", title: "Tujuan penerima" },
      { key: "title", title: "Judul" },
      {
        key: "message",
        title: "Pesan",
        formatter: (value) => {
          const plainText = String(value ?? "")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

          return (
            <span className="block max-w-64 truncate" title={plainText}>
              {truncateDescription(plainText)}
            </span>
          );
        },
      },
      {
        key: "status",
        title: "Status",
        formatter: (value) => {
          const status = String(value ?? "");
          const labels: Record<string, string> = {
            draft: "Draft",
            scheduled: "Scheduled",
            published: "Published",
            sent: "Sent",
          };
          const styles: Record<string, string> = {
            draft:
              "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900",
            scheduled:
              "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-900",
            published:
              "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900",
            sent: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-900",
          };

          return (
            <Badge
              className={`px-4 py-1 text-xs ${styles[status] ?? "bg-slate-100 text-slate-600 ring-slate-500/20"}`}
            >
              {labels[status] ?? (status || "-")}
            </Badge>
          );
        },
      },
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
      ...(values.send_at ? { send_at: toUtcIso(values.send_at) } : {}),
      ...(values.repeat_until
        ? { repeat_until: toUtcIso(values.repeat_until) }
        : {}),
    }),
    updatePayload: (values) => ({
      audience: values.audience,
      ...(values.target_id ? { target_id: values.target_id } : {}),
      title: values.title,
      message: values.message,
      repeat_type: String(values.repeat_type || "none"),
      ...(values.send_at ? { send_at: toUtcIso(values.send_at) } : {}),
      ...(values.repeat_until
        ? { repeat_until: toUtcIso(values.repeat_until) }
        : {}),
    }),
  };
}
