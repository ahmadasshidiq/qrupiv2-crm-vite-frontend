import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Printer,
  RotateCcw,
  Users,
} from "lucide-react";
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
import { ApiError } from "@/lib/api/client";
import type { ApiRecordDto } from "@/lib/dto/api";
import type { ActivityChartResponseDto } from "@/lib/dto/activity-chart";
import { fetchActivityCategories } from "@/pages/activity-categories/actions";
import { fetchLearningGroups } from "@/pages/learning-groups/actions";
import { fetchActivityChart } from "../actions";
import {
  Bar,
  BarChart,
  Cell,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  XAxis,
} from "@/components/ui/chart";

type ActivityFilters = {
  categoryId: string;
  type: "" | "positive" | "violation";
  startDate: string;
  endDate: string;
  learningGroupId: string;
};

const EMPTY_FILTERS: ActivityFilters = {
  categoryId: "",
  type: "",
  startDate: "",
  endDate: "",
  learningGroupId: "",
};

const CHART_COLORS = [
  "#2563eb",
  "#8b5cf6",
  "#06b6d4",
  "#f59e0b",
  "#ec4899",
  "#10b981",
  "#ef4444",
];

export function ActivityChartMode({ onBack }: { onBack: () => void }) {
  const [categories, setCategories] = useState<ApiRecordDto[]>([]);
  const [groups, setGroups] = useState<ApiRecordDto[]>([]);
  const [chartData, setChartData] = useState<ActivityChartResponseDto | null>(
    null,
  );
  const [draftFilters, setDraftFilters] =
    useState<ActivityFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<ActivityFilters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const task = window.setTimeout(() => {
      void Promise.all([
        fetchActivityCategories(1, 100),
        fetchLearningGroups(1, 100),
      ])
        .then(([categoryResult, groupResult]) => {
          setCategories(categoryResult.items);
          setGroups(groupResult.items);
        })
        .catch((error) =>
          toast.error(
            error instanceof ApiError
              ? error.message
              : "Pilihan filter gagal dimuat.",
          ),
        );
    }, 0);
    return () => window.clearTimeout(task);
  }, []);

  const fetchChartData = useCallback(async () => {
    setLoading(true);
    const apiFilters = {
      category_id: appliedFilters.categoryId || undefined,
      type: appliedFilters.type || undefined,
      start_date: appliedFilters.startDate || undefined,
      end_date: appliedFilters.endDate || undefined,
      learning_group_id: appliedFilters.learningGroupId || undefined,
    };
    try {
      setChartData(await fetchActivityChart(apiFilters));
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Data grafik gagal dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    const task = window.setTimeout(() => void fetchChartData(), 0);
    return () => window.clearTimeout(task);
  }, [fetchChartData]);

  const summary = chartData?.summary ?? {
    total_activities: 0,
    positive_activities: 0,
    violation_activities: 0,
    total_points: 0,
  };
  const chartItems = useMemo(() => {
    return (chartData?.activities_by_item ?? [])
      .slice(0, 12)
      .map((item, index) => ({
        label: item.activity_item_name,
        total: item.total_activities,
        color: item.color ?? CHART_COLORS[index % CHART_COLORS.length],
      }));
  }, [chartData]);

  const groupChartItems = useMemo(() => {
    return (chartData?.activities_by_learning_group ?? [])
      .slice(0, 6)
      .map((item) => ({
        label: item.learning_group_name,
        total: item.total_activities,
      }));
  }, [chartData]);
  const groupMaximum = Math.max(
    1,
    ...groupChartItems.map((item) => item.total),
  );
  const dailyChartItems = useMemo(() => {
    return (chartData?.daily_trend ?? []).slice(-14).map((item) => ({
      label: new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
      }).format(new Date(item.date)),
      positive: item.positive_activities,
      violation: item.violation_activities,
    }));
  }, [chartData]);
  const hasDailyPositive = dailyChartItems.some((item) => item.positive > 0);
  const hasDailyViolation = dailyChartItems.some((item) => item.violation > 0);
  const topStudents = useMemo(() => {
    return (chartData?.top_students ?? []).slice(0, 5).map((item) => ({
      name: item.user_name,
      activities: item.total_activities,
      points: item.total_points,
    }));
  }, [chartData]);
  const topTeachers = useMemo(() => {
    return (chartData?.top_teachers ?? []).slice(0, 5).map((item) => ({
      name: item.user_name,
      activities: item.total_activities,
    }));
  }, [chartData]);
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
    const charts = Array.from(
      document.querySelectorAll<HTMLElement>("[data-export-activity-chart]"),
    )
      .map((element) => {
        const svg = element.querySelector("svg");
        return svg
          ? `<section><h2>${escapeHtml(element.dataset.exportTitle)}</h2>${svg.outerHTML}</section>`
          : "";
      })
      .join("");
    const groupRows = (chartData?.activities_by_learning_group ?? [])
      .map(
        (item) =>
          `<tr><td>${escapeHtml(item.learning_group_name)}</td><td>${item.total_activities}</td></tr>`,
      )
      .join("");
    const studentRows = topStudents
      .map(
        (item) =>
          `<tr><td>${escapeHtml(item.name)}</td><td>${item.activities}</td><td>${item.points}</td></tr>`,
      )
      .join("");
    const teacherRows = topTeachers
      .map(
        (item) =>
          `<tr><td>${escapeHtml(item.name)}</td><td>${item.activities}</td></tr>`,
      )
      .join("");
    report.document.write(
      `<!doctype html><html><head><title>Laporan Grafik Aktivitas</title><style>body{font-family:Arial,sans-serif;color:#111827;padding:32px}h1{margin:0 0 4px;font-size:24px}h2{margin:28px 0 10px;font-size:16px;border-bottom:1px solid #e5e7eb;padding-bottom:8px}.meta{color:#6b7280;font-size:12px;margin-bottom:20px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.card{border:1px solid #e5e7eb;border-radius:8px;padding:12px}.label{font-size:11px;color:#6b7280}.value{font-size:20px;font-weight:700;margin-top:5px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{text-align:left;border-bottom:1px solid #e5e7eb;padding:8px}th{color:#6b7280}section{margin:28px 0;break-inside:avoid}section svg{display:block;width:100%;height:280px}@media print{body{padding:0}}</style></head><body><h1>Grafik Aktivitas</h1><div class="meta">${escapeHtml(appliedFilters.startDate || "Semua tanggal")} sampai ${escapeHtml(appliedFilters.endDate || "Semua tanggal")}</div><div class="cards"><div class="card"><div class="label">Total aktivitas</div><div class="value">${summary.total_activities}</div></div><div class="card"><div class="label">Aktivitas positif</div><div class="value">${summary.positive_activities}</div></div><div class="card"><div class="label">Pelanggaran</div><div class="value">${summary.violation_activities}</div></div></div>${charts}<h2>Aktivitas per Grup Pembelajaran</h2><table><thead><tr><th>Grup</th><th>Total aktivitas</th></tr></thead><tbody>${groupRows}</tbody></table><h2>Top Siswa</h2><table><thead><tr><th>Nama</th><th>Aktivitas</th><th>Poin</th></tr></thead><tbody>${studentRows}</tbody></table><h2>Top Guru</h2><table><thead><tr><th>Nama</th><th>Aktivitas</th></tr></thead><tbody>${teacherRows}</tbody></table></body></html>`,
    );
    report.document.close();
    report.focus();
    report.setTimeout(() => {
      report.print();
      report.close();
    }, 300);
  };
  const selectCategory = categories.find(
    (item) => item.id === draftFilters.categoryId,
  );
  const selectGroup = groups.find(
    (item) => item.id === draftFilters.learningGroupId,
  );

  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8 lg:px-10">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-2"
            onClick={onBack}
          >
            <ArrowLeft className="size-4" /> Kembali ke daftar
          </Button>
          <h2 className="text-xl font-bold tracking-tight">Grafik Aktivitas</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Pantau tren aktivitas positif dan pelanggaran berdasarkan filter
            yang dipilih.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Filter Grafik</h3>
          <Button
            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraftFilters(EMPTY_FILTERS);
              setAppliedFilters(EMPTY_FILTERS);
            }}
          >
            <RotateCcw className="size-4" /> Reset Filter
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="grid gap-1.5">
            <Label>Kategori</Label>
            <Select
              value={
                selectCategory
                  ? String(selectCategory.name ?? "Semua kategori")
                  : "Semua kategori"
              }
              onValueChange={(label) =>
                setDraftFilters((value) => ({
                  ...value,
                  categoryId:
                    categories.find((item) => String(item.name) === label)
                      ?.id ?? "",
                }))
              }
            >
              <SelectTrigger className="!h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua kategori">Semua kategori</SelectItem>
                {categories.map((item) => (
                  <SelectItem key={String(item.id)} value={String(item.name)}>
                    {String(item.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Tipe</Label>
            <Select
              value={
                draftFilters.type === "positive"
                  ? "Positif"
                  : draftFilters.type === "violation"
                    ? "Pelanggaran"
                    : "Semua tipe"
              }
              onValueChange={(label) =>
                setDraftFilters((value) => ({
                  ...value,
                  type:
                    label === "Positif"
                      ? "positive"
                      : label === "Pelanggaran"
                        ? "violation"
                        : "",
                }))
              }
            >
              <SelectTrigger className="!h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua tipe">Semua tipe</SelectItem>
                <SelectItem value="Positif">Positif</SelectItem>
                <SelectItem value="Pelanggaran">Pelanggaran</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Tanggal mulai</Label>
            <Input
              type="date"
              className="!h-9"
              value={draftFilters.startDate}
              onChange={(event) =>
                setDraftFilters((value) => ({
                  ...value,
                  startDate: event.target.value,
                }))
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Tanggal akhir</Label>
            <Input
              type="date"
              className="!h-9"
              value={draftFilters.endDate}
              onChange={(event) =>
                setDraftFilters((value) => ({
                  ...value,
                  endDate: event.target.value,
                }))
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Grup belajar</Label>
            <Select
              value={
                selectGroup
                  ? String(selectGroup.name ?? "Semua grup")
                  : "Semua grup"
              }
              onValueChange={(label) =>
                setDraftFilters((value) => ({
                  ...value,
                  learningGroupId:
                    groups.find((item) => String(item.name) === label)?.id ??
                    "",
                }))
              }
            >
              <SelectTrigger className="!h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua grup">Semua grup</SelectItem>
                {groups.map((item) => (
                  <SelectItem key={String(item.id)} value={String(item.name)}>
                    {String(item.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <div className="flex gap-2">
            <Button
              className="p-4 bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => setAppliedFilters(draftFilters)}
            >
              Terapkan Filter
            </Button>
            <Button
              variant="outline"
              className="gap-2 p-4 bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
              onClick={exportPdf}
              disabled={loading || !chartData}
            >
              <Printer className="size-4" /> Export PDF
            </Button>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<BarChart3 className="size-4" />}
          label="Total aktivitas"
          value={summary.total_activities}
          tone="blue"
        />
        <StatCard
          icon={<CalendarDays className="size-4" />}
          label="Aktivitas positif"
          value={summary.positive_activities}
          tone="emerald"
        />
        <StatCard
          icon={<Users className="size-4" />}
          label="Pelanggaran"
          value={summary.violation_activities}
          tone="red"
        />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[3fr_2fr]">
        <section
          data-export-activity-chart
          data-export-title="Aktivitas per Jenis"
          className="rounded-2xl border border-slate-200 bg-white px-5 pt-5 pb-2 dark:border-white/10 dark:bg-white/[0.04]"
        >
          <div>
            <h3 className="text-sm font-semibold">Aktivitas per Jenis</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Jumlah pencatatan untuk setiap jenis aktivitas. Total poin:{" "}
              {summary.total_points}
            </p>
          </div>
          {loading ? (
            <div className="mt-8 h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-white/10" />
          ) : chartItems.length ? (
            <div className="mt-6 h-64">
              <ChartContainer>
                <BarChart
                  data={chartItems}
                  margin={{ top: 4, right: 8, left: -20, bottom: 14 }}
                >
                  <XAxis
                    dataKey="label"
                    padding={{ left: 28, right: 28 }}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    angle={0}
                    textAnchor="middle"
                    height={28}
                    interval={0}
                    tick={{ fontSize: 10 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total" name="Catatan" radius={[6, 6, 0, 0]}>
                    {chartItems.map((item) => (
                      <Cell key={item.label} fill={item.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
              Belum ada aktivitas sesuai filter.
            </div>
          )}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
          <div>
            <h3 className="text-sm font-semibold">
              Aktivitas per Grup Pembelajaran
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Grup pembelajaran dengan jumlah aktivitas terbanyak.
            </p>
          </div>
          {loading ? (
            <div className="mt-6 h-44 animate-pulse rounded-xl bg-slate-100 dark:bg-white/10" />
          ) : groupChartItems.length ? (
            <div className="mt-6 space-y-4">
              {groupChartItems.map((item) => (
                <div key={item.label}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="truncate font-medium">{item.label}</span>
                    <span className="text-zinc-500">{item.total} catatan</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${(item.total / groupMaximum) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-44 items-center justify-center text-sm text-zinc-500">
              Belum ada grup belajar sesuai filter.
            </div>
          )}
        </section>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
          <div>
            <h3 className="text-sm font-semibold">Top Siswa</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Siswa dengan poin aktivitas tertinggi.
            </p>
          </div>
          {loading ? (
            <div className="mt-6 h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-white/10" />
          ) : topStudents.length ? (
            <div className="mt-5 divide-y divide-slate-100 dark:divide-white/10">
              {topStudents.map((student, index) => (
                <div
                  key={student.name}
                  className="flex items-center gap-3 py-3"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {student.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {student.activities} aktivitas
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">
                    {student.points} poin
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
              Belum ada siswa sesuai filter.
            </div>
          )}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
          <div>
            <h3 className="text-sm font-semibold">Top Guru</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Guru dengan aktivitas terbanyak sesuai filter.
            </p>
          </div>
          {loading ? (
            <div className="mt-6 h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-white/10" />
          ) : topTeachers.length ? (
            <div className="mt-5 divide-y divide-slate-100 dark:divide-white/10">
              {topTeachers.map((teacher, index) => (
                <div
                  key={teacher.name}
                  className="flex items-center gap-3 py-3"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {teacher.name}
                  </span>
                  <span className="text-sm font-semibold text-emerald-600">
                    {teacher.activities} aktivitas
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
              Belum ada guru sesuai filter.
            </div>
          )}
        </section>
      </div>
      <section
        data-export-activity-chart
        data-export-title="Tren Aktivitas Harian"
        className="mt-5 rounded-2xl border border-slate-200 bg-white px-5 pt-5 pb-2 dark:border-white/10 dark:bg-white/[0.04]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Tren Aktivitas Harian</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Perbandingan catatan positif dan pelanggaran per tanggal.
            </p>
          </div>
          <div className="flex gap-3 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1">
              <i className="size-2 rounded-full bg-emerald-500" /> Positif
            </span>
            <span className="flex items-center gap-1">
              <i className="size-2 rounded-full bg-red-500" /> Pelanggaran
            </span>
          </div>
        </div>
        {loading ? (
          <div className="mt-8 h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-white/10" />
        ) : dailyChartItems.length ? (
          <div className="mt-6 h-64">
            <ChartContainer>
              <BarChart
                data={dailyChartItems}
                margin={{ top: 4, right: 8, left: 8, bottom: 14 }}
              >
                <XAxis
                  dataKey="label"
                  padding={{ left: 28, right: 28 }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  angle={0}
                  textAnchor="middle"
                  height={28}
                  interval={0}
                  tick={{ fontSize: 10 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                {hasDailyPositive ? (
                  <Bar
                    dataKey="positive"
                    name="Positif"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />
                ) : null}
                {hasDailyViolation ? (
                  <Bar
                    dataKey="violation"
                    name="Pelanggaran"
                    fill="#f43f5e"
                    radius={[6, 6, 0, 0]}
                  />
                ) : null}
              </BarChart>
            </ChartContainer>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
            Belum ada aktivitas sesuai filter.
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "blue" | "emerald" | "red";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300",
    emerald:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300",
    red: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div
        className={`mb-3 flex size-8 items-center justify-center rounded-lg ${colors[tone]}`}
      >
        {icon}
      </div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
