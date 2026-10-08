import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Printer, RotateCcw } from "lucide-react";
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
import {
  Cell,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Pie,
  PieChart,
} from "@/components/ui/chart";

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
  const exportPdf = () => {
    const report = window.open("", "_blank", "width=1000,height=800");
    if (!report) {
      toast.error("Popup diblokir browser. Izinkan popup untuk export PDF.");
      return;
    }
    const escapeHtml = (value: unknown) =>
      String(value ?? "-").replace(
        /[&<>"']/g,
        (character) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
          })[character] ?? character,
      );
    const chartMarkup = Array.from(
      document.querySelectorAll<HTMLElement>("[data-export-chart]"),
    )
      .map((element, index) => {
        const svg = element.querySelector("svg");
        if (!svg) return "";
        if (index === 0) {
          return `<section style="margin:28px 0;break-inside:avoid"><h2 style="margin:0 0 8px">Tren harian</h2><div style="height:280px;width:100%">${svg.outerHTML}</div><div style="font-size:12px;color:#4b5563">● Tepat waktu &nbsp;&nbsp; ● Terlambat &nbsp;&nbsp; ● Tidak hadir</div></section>`;
        }
        return `<section style="margin:28px 0;break-inside:avoid"><h2 style="margin:0 0 8px">Alasan ketidakhadiran terbanyak</h2><div style="display:flex;align-items:center;gap:32px"><div style="position:relative;height:280px;width:280px"><div style="height:280px;width:280px">${svg.outerHTML}</div><div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:14px;color:#6b7280">Total<strong style="font-size:22px;color:#111827">${reasonTotal}</strong></div></div><div style="flex:1">${absenceReasons.map((item) => `<div style="display:flex;justify-content:space-between;border-bottom:1px solid #e5e7eb;padding:8px 0;font-size:13px"><span>${escapeHtml(item.absence_reason_name)}</span><strong>${item.total} (${item.percentage}%)</strong></div>`).join("")}</div></div></section>`;
      })
      .join("");
    report.document.write(
      `<!doctype html><html><head><title>Laporan Grafik Absensi</title><style>body{font-family:Arial,sans-serif;color:#111827;padding:32px}h1{margin:0 0 4px;font-size:24px}h2{margin:28px 0 10px;font-size:16px;border-bottom:1px solid #e5e7eb;padding-bottom:8px}.meta{color:#6b7280;font-size:12px;margin-bottom:20px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.card{border:1px solid #e5e7eb;border-radius:8px;padding:12px}.label{font-size:11px;color:#6b7280}.value{font-size:20px;font-weight:700;margin-top:5px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{text-align:left;border-bottom:1px solid #e5e7eb;padding:8px}th{color:#6b7280}@media print{body{padding:0}}</style></head><body><h1>Grafik Absensi ${filters.type === "student" ? "Siswa" : "Guru"}</h1><div class="meta">Periode: ${escapeHtml(filters.start_date)} sampai ${escapeHtml(filters.end_date)} · Dibuat: ${escapeHtml(new Date().toLocaleString("id-ID"))}</div><div class="cards">${[
        ["Total record", summary.total_records],
        ["Tepat waktu", summary.on_time],
        ["Terlambat", summary.late],
        ["Tidak hadir", summary.absent],
      ]
        .map(
          ([label, value]) =>
            `<div class="card"><div class="label">${label}</div><div class="value">${value}</div></div>`,
        )
        .join(
          "",
        )}</div><h2>Tren harian</h2><table><thead><tr><th>Tanggal</th><th>Tepat waktu</th><th>Terlambat</th><th>Tidak hadir</th><th>Total</th></tr></thead><tbody>${trend.map((item) => `<tr><td>${escapeHtml(item.date)}</td><td>${item.on_time}</td><td>${item.late}</td><td>${item.absent}</td><td>${item.total}</td></tr>`).join("")}</tbody></table><h2>Per grup belajar</h2><table><thead><tr><th>Grup</th><th>Total</th><th>Tepat waktu</th><th>Terlambat</th><th>Tidak hadir</th><th>Rate</th></tr></thead><tbody>${(data?.by_learning_group ?? []).map((item) => `<tr><td>${escapeHtml(item.learning_group_name)}</td><td>${item.total}</td><td>${item.on_time}</td><td>${item.late}</td><td>${item.absent}</td><td>${item.attendance_rate}%</td></tr>`).join("")}</tbody></table></body></html>`,
    );
    report.document.close();
    report.document.body.insertAdjacentHTML("beforeend", `${chartMarkup}`);
    report.focus();
    report.setTimeout(() => {
      report.print();
      report.close();
    }, 300);
  };
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
        <div className="mt-4 flex justify-end gap-2">
          <Button
            className="p-4 bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setFilters(draft)}
          >
            Terapkan Filter
          </Button>
          <Button
            variant="outline"
            className="gap-2 p-4 bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
            onClick={exportPdf}
            disabled={!data || loading}
          >
            <Printer className="size-4" /> Export PDF
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
          <div
            key={String(label)}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"
          >
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-bold">{loading ? "-" : value}</p>
          </div>
        ))}{" "}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section
          data-export-chart
          className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"
        >
          <h2 className="font-semibold">Tren harian</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Jumlah absensi berdasarkan Waktu Kejadian.
          </p>
          <div className="flex h-64 items-end gap-2 overflow-visible border-b pb-1">
            {trend.length ? (
              trend.map((item) => (
                <div
                  key={item.date}
                  className="flex min-w-8 flex-1 flex-col items-center gap-1"
                >
                  <div className="flex h-52 items-end gap-0.5 overflow-visible pt-8">
                    {status.map((entry) => (
                      <div
                        key={entry.key}
                        className={`${entry.color} group relative w-2 rounded-t`}
                        style={{
                          height: `${(item[entry.key as "on_time" | "late" | "absent"] / maximum) * 100}%`,
                        }}
                      >
                        <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-[10px] text-white shadow-lg group-hover:block">
                          {entry.label}:{" "}
                          {item[entry.key as "on_time" | "late" | "absent"]}
                        </span>
                      </div>
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
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
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
          <div className="mt-8 rounded-lg bg-slate-50 p-4 text-sm dark:bg-white/[0.03]">
            <p>Tingkat kehadiran</p>
            <p className="mt-1 text-2xl font-bold">
              {summary.attendance_rate}%
            </p>
            <p className="mt-1 text-muted-foreground">
              Persentase keterlambatan{" "}
              {summary.total_records
                ? ((summary.late / summary.total_records) * 100).toFixed(2)
                : "0.00"}
              %
            </p>
          </div>
        </section>
      </div>
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[2fr_3fr]">
        <section
          data-export-chart
          className="h-fit rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]"
        >
          <h2 className="text-base font-semibold">
            Alasan ketidakhadiran terbanyak
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Distribusi alasan berdasarkan data absensi dengan status tidak
            hadir.
          </p>
          {absenceReasons.length ? (
            <div className="mt-4 grid items-center gap-4 md:grid-cols-[210px_1fr]">
              <div className="relative mx-auto size-52">
                <ChartContainer>
                  <PieChart>
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      position={{ x: 8, y: 0 }}
                    />
                    <Pie
                      data={absenceReasons}
                      dataKey="total"
                      nameKey="absence_reason_name"
                      innerRadius={54}
                      outerRadius={92}
                      paddingAngle={2}
                    >
                      {absenceReasons.map((item, index) => (
                        <Cell
                          key={
                            item.absence_reason_id ?? item.absence_reason_name
                          }
                          fill={REASON_COLORS[index % REASON_COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center text-xs text-muted-foreground">
                  <span>Total</span>
                  <strong className="mt-1 text-lg leading-none text-foreground">
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
        <section className="h-fit rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
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
