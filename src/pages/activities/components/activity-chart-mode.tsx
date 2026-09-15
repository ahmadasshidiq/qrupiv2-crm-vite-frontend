import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
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
  const [chartData, setChartData] = useState<ActivityChartResponseDto | null>(null);
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
    return (chartData?.activities_by_item ?? []).slice(0, 12).map((item, index) => ({
      label: item.activity_item_name,
      total: item.total_activities,
      color: item.color ?? CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [chartData]);

  const maximum = Math.max(1, ...chartItems.map((item) => item.total));
  const groupChartItems = useMemo(() => {
    return (chartData?.activities_by_learning_group ?? []).slice(0, 6).map(
      (item) => ({
        label: item.learning_group_name,
        total: item.total_activities,
      }),
    );
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
  const dailyMaximum = Math.max(
    1,
    ...dailyChartItems.map((item) => Math.max(item.positive, item.violation)),
  );
  const topStudents = useMemo(() => {
    return (chartData?.top_students ?? []).slice(0, 5).map((item) => ({
      name: item.user_name,
      activities: item.total_activities,
      points: item.total_points,
    }));
  }, [chartData]);
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
          <Button
            className="p-4 bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setAppliedFilters(draftFilters)}
          >
            Terapkan Filter
          </Button>
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
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
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
          <div className="mt-8 flex h-64 items-end gap-3 overflow-x-auto pb-8">
            {chartItems.map((item) => (
              <div
                key={item.label}
                className="flex h-full min-w-24 flex-1 flex-col justify-end gap-2 text-center"
              >
                <div className="flex flex-1 items-end justify-center">
                  <span
                    className="w-full max-w-16 rounded-t-md"
                    style={{
                      height: `${Math.max(8, (item.total / maximum) * 100)}%`,
                      backgroundColor: item.color,
                    }}
                    title={`${item.label}: ${item.total} catatan`}
                  />
                </div>
                <span
                  className="line-clamp-2 min-h-7 text-[10px] leading-tight text-zinc-500"
                  title={item.label}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
            Belum ada aktivitas sesuai filter.
          </div>
        )}
      </section>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
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
            <div className="mt-6 h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-white/10" />
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
            <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
              Belum ada grup belajar sesuai filter.
            </div>
          )}
        </section>
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
      </div>
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
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
          <div className="mt-8 flex h-64 items-end gap-3 overflow-x-auto pb-8">
            {dailyChartItems.map((item) => (
              <div
                key={item.label}
                className="flex h-full min-w-14 flex-1 flex-col justify-end gap-2 text-center"
              >
                <div className="flex flex-1 items-end justify-center gap-1">
                  <span
                    className="w-4 rounded-t bg-emerald-500"
                    style={{
                      height: `${item.positive ? Math.max(8, (item.positive / dailyMaximum) * 100) : 0}%`,
                    }}
                    title={`${item.positive} positif`}
                  />
                  <span
                    className="w-4 rounded-t bg-red-500"
                    style={{
                      height: `${item.violation ? Math.max(8, (item.violation / dailyMaximum) * 100) : 0}%`,
                    }}
                    title={`${item.violation} pelanggaran`}
                  />
                </div>
                <span className="whitespace-nowrap text-[10px] text-zinc-500">
                  {item.label}
                </span>
              </div>
            ))}
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
