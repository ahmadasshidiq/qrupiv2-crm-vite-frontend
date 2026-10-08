import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchLearningGroups } from "@/pages/learning-groups/actions";
import { fetchAttendanceChart } from "./chart-actions";
import type { AttendanceChartResponseDto } from "@/lib/dto/attendance-chart";

type AttendanceFilters = {
  type: "student" | "teacher";
  start_date: string;
  end_date: string;
  learning_group_id: string;
};

function createDefaultFilters(): AttendanceFilters {
  const today = new Date();
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    type: "student",
    start_date: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    end_date: formatDate(today),
    learning_group_id: "",
  };
}

const EMPTY: AttendanceFilters = {
  type: "student" as "student" | "teacher",
  start_date: createDefaultFilters().start_date,
  end_date: createDefaultFilters().end_date,
  learning_group_id: "",
};
const STATUS = [
  { key: "on_time", label: "Tepat waktu", color: "bg-emerald-500" },
  { key: "late", label: "Terlambat", color: "bg-amber-500" },
  { key: "absent", label: "Tidak hadir", color: "bg-red-500" },
];
const REASON_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
];

export default function AttendanceChartPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(EMPTY);
  const [filters, setFilters] = useState(EMPTY);
  const [groups, setGroups] = useState<Array<{ id?: string; name?: string }>>(
    [],
  );
  const [data, setData] = useState<AttendanceChartResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const task = window.setTimeout(() => {
      void fetchLearningGroups(1, 500, { "lg.status": "active" })
        .then((result) => setGroups(result.items))
        .catch(() => toast.error("Grup belajar gagal dimuat."));
    }, 0);
    return () => window.clearTimeout(task);
  }, []);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchAttendanceChart(filters));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Data grafik gagal dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);
  useEffect(() => {
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, [load]);
  const summary = useMemo(
    () =>
      data?.summary ?? {
        total_records: 0,
        on_time: 0,
        late: 0,
        absent: 0,
        attendance_rate: 0,
        average_late_minutes: 0,
      },
    [data],
  );
  const trend = data?.daily_trend ?? [];
  const maximum = Math.max(
    1,
    ...trend.map((item) => Math.max(item.on_time, item.late, item.absent)),
  );
  const status = useMemo(
    () =>
      STATUS.map((item) => ({
        ...item,
        total: summary[item.key as "on_time" | "late" | "absent"],
      })),
    [summary],
  );
  const absenceReasons = useMemo(() => data?.absence_by_reason ?? [], [data]);
  const reasonTotal = absenceReasons.reduce(
    (total, item) => total + item.total,
    0,
  );
  const reasonGradient = useMemo(() => {
    if (!reasonTotal) return "#f4f4f5 0 100%";
    let position = 0;
    return absenceReasons
      .map((item, index) => {
        const start = position;
        position += (item.total / reasonTotal) * 100;
        return `${REASON_COLORS[index % REASON_COLORS.length]} ${start}% ${position}%`;
      })
      .join(", ");
  }, [absenceReasons, reasonTotal]);
  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8 lg:px-10">
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 -ml-2"
        onClick={() => navigate("/attendances")}
      >
        <ArrowLeft className="size-4" /> Kembali ke absensi
      </Button>
      <h1 className="text-xl font-bold tracking-tight">Grafik Absensi</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Pantau tren kehadiran siswa dan guru berdasarkan periode yang dipilih.
      </p>
      <section className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Filter Grafik</h2>
          <Button
            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraft(createDefaultFilters());
              setFilters(createDefaultFilters());
            }}
          >
            <RotateCcw className="size-4" /> Reset Filter
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-1.5">
            <Label>Jenis pengguna</Label>
            <Select
              value={draft.type === "student" ? "Siswa" : "Guru"}
              onValueChange={(value) => {
                setDraft((v) => ({
                  ...v,
                  type: value === "Guru" ? "teacher" : "student",
                }));
              }}
            >
              <SelectTrigger className="!h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Siswa">Siswa</SelectItem>
                <SelectItem value="Guru">Guru</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Tanggal mulai</Label>
            <Input
              className="!h-9"
              type="date"
              value={draft.start_date}
              onChange={(e) =>
                setDraft((v) => ({ ...v, start_date: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Tanggal akhir</Label>
            <Input
              className="!h-9"
              type="date"
              value={draft.end_date}
              onChange={(e) =>
                setDraft((v) => ({ ...v, end_date: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Grup belajar</Label>
            <Select
              value={
                groups.find(
                  (group) => String(group.id) === draft.learning_group_id,
                )?.name ?? "Semua grup"
              }
              onValueChange={(value) =>
                setDraft((v) => ({
                  ...v,
                  learning_group_id:
                    value === "Semua grup"
                      ? ""
                      : String(
                          groups.find((group) => group.name === value)?.id ??
                            "",
                        ),
                }))
              }
            >
              <SelectTrigger className="!h-9 w-full">
                <SelectValue placeholder="Semua grup" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua grup">Semua grup</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={String(group.id)} value={String(group.name)}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            className="p-4 bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setFilters(draft)}
          >
            Terapkan Filter
          </Button>
        </div>
      </section>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total record", summary.total_records],
          ["Tepat waktu", summary.on_time],
          ["Terlambat", summary.late],
          ["Tidak hadir", summary.absent],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-bold">{loading ? "-" : value}</p>
          </div>
        ))}{" "}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Tren harian</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Jumlah absensi berdasarkan Waktu Kejadian.
          </p>
          <div className="flex h-64 items-end gap-2 overflow-x-auto border-b pb-1">
            {trend.length ? (
              trend.map((item) => (
                <div
                  key={item.date}
                  className="flex min-w-8 flex-1 flex-col items-center gap-1"
                >
                  <div className="flex h-52 items-end gap-0.5">
                    {status.map((entry) => (
                      <div
                        key={entry.key}
                        title={`${entry.label}: ${item[entry.key as "on_time" | "late" | "absent"]}`}
                        className={`${entry.color} w-2 rounded-t`}
                        style={{
                          height: `${(item[entry.key as "on_time" | "late" | "absent"] / maximum) * 100}%`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(item.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              ))
            ) : (
              <p className="m-auto text-sm text-muted-foreground">
                Belum ada data grafik.
              </p>
            )}
          </div>
          <div className="mt-4 flex gap-4 text-xs">
            {STATUS.map((item) => (
              <span key={item.key} className="flex items-center gap-1">
                <i className={`${item.color} size-2 rounded-full`} />
                {item.label}
              </span>
            ))}
          </div>
        </section>
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Ringkasan status</h2>
          <div className="mt-5 space-y-4">
            {status.map((item) => (
              <div key={item.key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="font-medium">{item.total}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className={`${item.color} h-2 rounded-full`}
                    style={{
                      width: `${summary.total_records ? (item.total / summary.total_records) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-lg bg-muted/50 p-4 text-sm">
            <p>Tingkat kehadiran</p>
            <p className="mt-1 text-2xl font-bold">
              {summary.attendance_rate}%
            </p>
            <p className="mt-1 text-muted-foreground">
              Rata-rata keterlambatan {summary.average_late_minutes} menit
            </p>
          </div>
        </section>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Alasan ketidakhadiran terbanyak</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Distribusi alasan berdasarkan data absensi dengan status tidak
            hadir.
          </p>
          {absenceReasons.length ? (
            <div className="mt-5 grid items-center gap-6 md:grid-cols-[220px_1fr]">
              <div
                className="mx-auto flex size-48 items-center justify-center rounded-full"
                style={{ background: `conic-gradient(${reasonGradient})` }}
              >
                <div className="flex size-28 items-center justify-center rounded-full bg-card text-center text-xs text-muted-foreground">
                  Total
                  <br />
                  <strong className="text-lg text-foreground">
                    {reasonTotal}
                  </strong>
                </div>
              </div>
              <div className="space-y-3">
                {absenceReasons.slice(0, 8).map((item, index) => (
                  <div
                    key={item.absence_reason_id ?? item.absence_reason_name}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <i
                        className="size-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            REASON_COLORS[index % REASON_COLORS.length],
                        }}
                      />{" "}
                      <span className="truncate">
                        {item.absence_reason_name}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium">
                      {item.total} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">
              Belum ada data alasan ketidakhadiran.
            </p>
          )}
        </section>
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Per grup belajar</h2>
          {data?.by_learning_group?.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-muted-foreground">
                  <tr>
                    <th className="pb-3">Grup</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Tepat waktu</th>
                    <th className="pb-3">Terlambat</th>
                    <th className="pb-3">Tidak hadir</th>
                    <th className="pb-3">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_learning_group.map((item) => (
                    <tr
                      key={item.learning_group_id}
                      className="border-b last:border-0"
                    >
                      <td className="py-3 font-medium">
                        {item.learning_group_name}
                      </td>
                      <td>{item.total}</td>
                      <td>{item.on_time}</td>
                      <td>{item.late}</td>
                      <td>{item.absent}</td>
                      <td>{item.attendance_rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Belum ada data grup.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
