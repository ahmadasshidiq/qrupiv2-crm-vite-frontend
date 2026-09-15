import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DefaultModulePage } from "@/components/backend-module-page";
import { LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api/client";
import { getAccessToken, getAuthUser } from "@/lib/auth/session";
import {
  fetchAttendances,
  fetchMyAttendances,
  type AttendanceCategory,
} from "./actions";
import { ATTENDANCES_PAGE_CONFIG } from "./page.config";
import type { PaginationFilters } from "@/lib/api/paginated";
import type { ApiRecordDto } from "@/lib/dto/api";
import { AttendanceReportDialog } from "./components/attendance-report-dialog";

export default function AttendancesPage() {
  return <AdminAttendancesPage />;
}

function AdminAttendancesPage() {
  const [searchParams] = useSearchParams();
  const category: AttendanceCategory =
    searchParams.get("category") === "student" ? "student" : "teacher";
  const [reportOpen, setReportOpen] = useState(false);
  const [reportKey, setReportKey] = useState(0);
  const config = useMemo(
    () => ({
      ...ATTENDANCES_PAGE_CONFIG,
      fields: ATTENDANCES_PAGE_CONFIG.fields.filter((field) =>
        category === "student"
          ? field.key !== "user_email"
          : !["learning_group_name", "recorded_user_name"].includes(field.key),
      ),
      title: category === "student" ? "Absensi Siswa" : "Absensi Guru",
      description:
        category === "student"
          ? "Pantau kehadiran dan status absensi siswa."
          : "Pantau kehadiran dan status absensi guru.",
      emptyMessage:
        category === "student"
          ? "Belum ada data absensi siswa"
          : "Belum ada data absensi guru",
    }),
    [category],
  );
  const fetchPage = useCallback(
    (page: number, limit: number, filters?: PaginationFilters) =>
      fetchAttendances(page, limit, category, filters),
    [category],
  );
  const exportAttendances = useCallback(async () => {
    try {
      const institutionName = getAuthUser()?.institution?.name ?? "Institusi";
      const isStudent = category === "student";
      const filename = isStudent
        ? "data_attendance_student"
        : "data_attendance_guru";
      const columns = isStudent
        ? [
            {
              key: "users.context_type",
              label: "Tipe Identitas",
              table: "users",
              foreignKey: "user_id",
              alias: "attendance_user",
            },
            {
              key: "users.context_code",
              label: "No. Identitas",
              table: "users",
              foreignKey: "user_id",
              alias: "attendance_user",
            },
            {
              key: "users",
              label: "Nama Siswa",
              table: "users",
              foreignKey: "user_id",
              alias: "attendance_user",
            },
            { key: "status", label: "Status Kehadiran" },
            { key: "absence_note", label: "Catatan Ketidakhadiran" },
            { key: "check_in_at", label: "Waktu Masuk" },
            { key: "check_in_lat", label: "Latitude Masuk" },
            { key: "check_in_long", label: "Longitude Masuk" },
            { key: "created_at", label: "Tanggal Dibuat" },
          ]
        : [
            {
              key: "users.context_type",
              label: "Tipe Identitas",
              table: "users",
              foreignKey: "user_id",
              alias: "attendance_user",
            },
            {
              key: "users.context_code",
              label: "No. Identitas",
              table: "users",
              foreignKey: "user_id",
              alias: "attendance_user",
            },
            {
              key: "users",
              label: "Nama Guru",
              table: "users",
              foreignKey: "user_id",
              alias: "attendance_user",
            },
            { key: "status", label: "Status Kehadiran" },
            { key: "absence_note", label: "Catatan Ketidakhadiran" },
            { key: "check_in_at", label: "Waktu Check In" },
            { key: "check_in_lat", label: "Latitude Check In" },
            { key: "check_in_long", label: "Longitude Check In" },
            { key: "check_out_at", label: "Waktu Check Out" },
            { key: "check_out_lat", label: "Latitude Check Out" },
            { key: "check_out_long", label: "Longitude Check Out" },
            { key: "created_at", label: "Tanggal Dibuat" },
          ];
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1"}/export/excel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAccessToken() ?? ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            models: "attendance_logs",
            title: `Data Absensi ${isStudent ? "Siswa" : "Guru"} ${institutionName}`,
            filename,
            pageSize: 500,
            limit: 0,
            filters: [
              { key: "type", operator: "=", value: isStudent ? "student" : "teacher" },
            ],
            column: columns,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Export absensi ${isStudent ? "siswa" : "guru"} gagal.`,
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}_${institutionName}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(
        `Data absensi ${isStudent ? "siswa" : "guru"} berhasil diekspor.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Export data gagal.",
      );
    }
  }, [category]);

  return (
    <>
      <DefaultModulePage
        config={config}
        fetchPage={fetchPage}
        onExport={() => void exportAttendances()}
        onToolbarAction={(action) => {
          if (action.href === "#attendance-report") {
            setReportKey((value) => value + 1);
            setReportOpen(true);
            return true;
          }
          return false;
        }}
      />
      <AttendanceReportDialog
        key={reportKey}
        category={category}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </>
  );
}

export function SelfAttendanceActions({
  userId,
  type,
}: {
  userId: string;
  type: string;
}) {
  const [saving, setSaving] = useState<"check-in" | "check-out" | null>(null);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const [todayLog, setTodayLog] = useState<ApiRecordDto | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const isToday = useCallback((value: unknown) => {
    if (!value || value === "-") return false;
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return false;
    return (
      date.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10)
    );
  }, []);

  const isAttendanceToday = useCallback(
    (record: ApiRecordDto) =>
      isToday(
        record.created_at ??
          record.updated_at ??
          record.check_in_at ??
          record.attendance_date ??
          record.check_in_date ??
          record.date,
      ),
    [isToday],
  );

  useEffect(() => {
    void fetchMyAttendances(1, 12, userId)
      .then((result) => {
        const currentLog = result.items.find(isAttendanceToday) ?? null;
        setTodayLog(currentLog);
        const active =
          currentLog &&
          currentLog.check_in_at &&
          (currentLog.check_out_at === null ||
            currentLog.check_out_at === undefined ||
            currentLog.check_out_at === "")
            ? currentLog
            : result.items.find(
                (record) =>
                  isAttendanceToday(record) &&
                  record.check_in_at &&
                  (record.check_out_at === null ||
                    record.check_out_at === undefined ||
                    record.check_out_at === ""),
              );
        setActiveLogId(active ? String(active.id) : null);
      })
      .catch(() => {
        setActiveLogId(null);
        setTodayLog(null);
      });
  }, [isAttendanceToday, userId]);
  const submit = (phase: "check-in" | "check-out") => {
    if (!navigator.geolocation)
      return toast.error("Browser tidak mendukung lokasi.");
    setSaving(phase);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let logId = activeLogId;
        if (phase === "check-out" && !logId) {
          const latest = await fetchMyAttendances(1, 12, userId).catch(() => ({
            items: [],
            total: 0,
          }));
          logId = latest.items[0]?.id ? String(latest.items[0].id) : null;
          if (logId) setActiveLogId(logId);
        }
        if (phase === "check-out" && !logId) {
          setSaving(null);
          toast.error("Belum ada check-in aktif untuk ditutup.");
          return;
        }
        const request =
          phase === "check-in"
            ? apiRequest("/attendance-logs/check-in", {
                method: "POST",
                body: {
                  user_id: userId,
                  type,
                  status: "on_time",
                  requires_check_out: true,
                  check_in_at: new Date().toISOString(),
                  location_lat: latitude,
                  location_long: longitude,
                },
              })
            : apiRequest(`/attendance-logs/${logId}/check-out`, {
                method: "PUT",
                body: {
                  check_out_at: new Date().toISOString(),
                  location_lat: latitude,
                  location_long: longitude,
                },
              });
        void request
          .then((result) => {
            if (phase === "check-in") {
              const response = result as {
                data?: { id?: unknown };
                id?: unknown;
              };
              setActiveLogId(String(response.data?.id ?? response.id ?? ""));
              setTodayLog((current) => ({
                ...(current ?? {}),
                id: String(response.data?.id ?? response.id ?? ""),
                type,
                status: "on_time",
                check_in_at: new Date().toISOString(),
                check_out_at: null,
              }));
            } else {
              setActiveLogId(null);
              setTodayLog((current) =>
                current
                  ? { ...current, check_out_at: new Date().toISOString() }
                  : current,
              );
            }
            setRefreshKey((value) => value + 1);
            toast.success(
              `${phase === "check-in" ? "Check-in" : "Check-out"} berhasil dicatat.`,
            );
          })
          .catch(() =>
            toast.error(
              `${phase === "check-in" ? "Check-in" : "Check-out"} gagal dicatat.`,
            ),
          )
          .finally(() => setSaving(null));
      },
      () => {
        setSaving(null);
        toast.error("Izin lokasi diperlukan untuk absensi.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };
  const config = useMemo(
    () => ({
      ...ATTENDANCES_PAGE_CONFIG,
      headerAction: undefined,
      fields: ATTENDANCES_PAGE_CONFIG.fields.filter(
        (field) =>
          !["learning_group_name", "recorded_user_name"].includes(field.key),
      ),
      title: "Absensi Saya",
      description: "Pantau riwayat kehadiran Anda.",
      actions: {
        view: false,
        create: false,
        edit: false,
        delete: false,
        filter: false,
        import: false,
        export: false,
      },
      toolbarActions: [
        ...(!todayLog
          ? [
              {
                label: saving === "check-in" ? "Memproses..." : "Check-in",
                href: "#check-in",
                icon: LogIn,
                className:
                  "bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white",
              },
            ]
          : []),
        ...(todayLog && todayLog.status !== "absent" && !todayLog.check_out_at
          ? [
              {
                label: saving === "check-out" ? "Memproses..." : "Check-out",
                href: "#check-out",
                icon: LogOut,
                className:
                  "bg-violet-500 text-white hover:bg-violet-600 hover:text-white",
              },
            ]
          : []),
      ],
    }),
    [saving, todayLog],
  );
  const fetchPage = useCallback(
    (page: number, limit: number, filters?: PaginationFilters) =>
      fetchMyAttendances(page, limit, userId, filters),
    [userId],
  );
  return (
    <DefaultModulePage
      key={refreshKey}
      config={config}
      fetchPage={fetchPage}
      onToolbarAction={(action) => {
        if (action.href === "#check-in") void submit("check-in");
        else if (action.href === "#check-out") void submit("check-out");
        return true;
      }}
    />
  );
}
