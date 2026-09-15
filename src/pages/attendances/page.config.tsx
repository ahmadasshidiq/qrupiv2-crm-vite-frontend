import type { BackendModuleConfig } from "@/components/backend-module-page";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, FileText } from "lucide-react";
import { AttendanceLog } from "./components/attendance-log";

export const ATTENDANCES_PAGE_CONFIG: BackendModuleConfig = {
  behaviorKey: "Absensi",
  title: "Absensi",
  description: "Pantau check-in, check-out, dan status kehadiran.",
  emptyMessage: "Belum ada data absensi",
  headerAction: {
    label: "Alasan Ketidakhadiran",
    icon: ClipboardList,
    href: "/absence-reasons",
  },
  toolbarActions: [
    { label: "Report Absensi PDF", href: "#attendance-report", icon: FileText },
  ],
  editableFields: [
    {
      key: "user_id",
      label: "Guru",
      type: "resource",
      resourceEndpoint: "/users",
      resourceFilters: { "u.type": "teacher" },
      resourcePlaceholder: "Cari guru",
      required: true,
      helperText: "Cari guru yang akan dicatat absensinya.",
    },
    {
      key: "check_in_at",
      label: "Jam masuk",
      type: "datetime-local",
      requiredWhen: { key: "status", values: ["on_time", "late"] },
      visibleWhen: { key: "status", values: ["on_time", "late"] },
      helperText: "Masukkan waktu guru mulai hadir.",
    },
    {
      key: "check_out_at",
      label: "Jam keluar",
      type: "datetime-local",
      visibleWhen: { key: "status", values: ["on_time", "late"] },
      helperText: "Opsional. Bisa dilengkapi saat data absensi diedit.",
    },
    { key: "type", label: "Tipe", type: "hidden" },
    { key: "status", label: "Status", type: "hidden" },
    { key: "requires_check_out", label: "Perlu check-out", type: "hidden" },
  ],
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
    { key: "user_context_type", title: "Tipe Identitas" },
    { key: "user_context_code", title: "No Identitas" },
    { key: "user_name", title: "Nama" },
    { key: "user_email", title: "Email" },
    { key: "learning_group_name", title: "Grup Belajar" },
    {
      key: "created_at",
      title: "Tanggal",
      formatter: (value, record) => {
        const dateValue = record.created_at ?? value;
        return dateValue
          ? new Date(String(dateValue)).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "-";
      },
    },
    {
      key: "status",
      title: "Status",
      formatter: (value, record) => {
        const status = String(value ?? "");
        const labels: Record<string, string> = {
          on_time: "Hadir",
          late: "Terlambat",
          absent: "Tidak hadir",
        };
        const tones: Record<string, string> = {
          on_time:
            "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
          absent:
            "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900",
          late: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
        };
        return (
          <Badge
            className={`px-4 py-1 text-xs font-bold ${tones[status] ?? ""}`}
          >
            {labels[status] ?? status}{" "}
            {record.status === "absent" && record.absence_reason_name ? `- ${record.absence_reason_name}` : ""}
          </Badge>
        );
      },
    },
    {
      key: "recorded_user_name",
      title: "Dicatat oleh",
      formatter: (_value, record) => String(record.recorded_user_name ?? "-"),
    },
    {
      key: "attendance_log",
      title: "Log Absensi",
      formatter: (_value, record) => <AttendanceLog record={record} />,
    },
  ],
};

export const ATTENDANCE_CREATE_CONFIG: BackendModuleConfig = {
  behaviorKey: "Absensi",
  title: "Absensi Guru",
  description: "Catat waktu dan status kehadiran guru.",
  emptyMessage: "Belum ada data absensi",
  editableFields: [
    {
      key: "user_ids",
      label: "Guru",
      type: "resource-multi",
      resourceEndpoint: "/users",
      resourceFilters: { "u.type": "teacher" },
      resourcePlaceholder: "Cari guru",
      required: true,
      fullWidth: true,
      helperText: "Pilih satu atau beberapa guru yang akan dicatat absensinya.",
    },
    {
      key: "status",
      label: "Status",
      fullWidth: true,
      options: [
        { label: "Hadir", value: "on_time" },
        { label: "Terlambat", value: "late" },
        { label: "Absent", value: "absent" },
      ],
      helperText: "Pilih status kehadiran guru.",
    },
    {
      key: "absence_reason_id",
      label: "Alasan tidak hadir",
      type: "resource",
      resourceEndpoint: "/attendance-absence-reasons",
      resourcePlaceholder: "Pilih alasan tidak hadir",
      visibleWhen: { key: "status", values: ["absent"] },
      requiredWhen: { key: "status", values: ["absent"] },
      helperText: "Wajib diisi jika status guru adalah absent.",
    },
    {
      key: "check_in_at",
      label: "Jam masuk",
      type: "datetime-local",
      requiredWhen: { key: "status", values: ["on_time", "late"] },
      visibleWhen: { key: "status", values: ["on_time", "late"] },
      helperText: "Masukkan waktu guru mulai hadir.",
    },
    {
      key: "check_out_at",
      label: "Jam keluar",
      type: "datetime-local",
      visibleWhen: { key: "status", values: ["on_time", "late"] },
      helperText: "Opsional. Bisa dilengkapi saat data absensi diedit.",
    },
    { key: "type", label: "Tipe", type: "hidden" },
    { key: "requires_check_out", label: "Perlu check-out", type: "hidden" },
  ],
  fields: ATTENDANCES_PAGE_CONFIG.fields,
  actions: { create: true },
  createEndpoint: "/attendance-logs/bulk",
  createPayload: (values) => ({
    attendance_logs: (Array.isArray(values.user_ids)
      ? values.user_ids
      : []
    ).map((userId) => ({
      user_id: userId,
      check_in_at: values.check_in_at,
      status: values.status,
      type: values.type,
      absence_reason_id: values.absence_reason_id,
      requires_check_out: values.status !== "absent",
      check_in_lat: 0,
      check_in_long: 0,
      ...(values.check_out_at
        ? {
            check_out_at: values.check_out_at,
            check_out_lat: 0,
            check_out_long: 0,
          }
        : {}),
    })),
  }),
};
