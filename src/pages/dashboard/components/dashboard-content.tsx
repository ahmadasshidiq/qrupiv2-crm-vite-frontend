import { useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  Activity,
  AlertTriangle,
  Award,
  BookOpen,
  Building2,
  CalendarCheck,
  ChevronRight,
  CircleCheck,
  GraduationCap,
  Info,
  Layers3,
  RotateCcw,
  ShieldAlert,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  XAxis,
  YAxis,
} from "@/components/ui/chart";
import { ApiError } from "@/lib/api/client";
import { canReadModel, getAuthUser, getRoleName } from "@/lib/auth/session";
import { fetchDashboard } from "../actions";
import type { DashboardFilters } from "../actions";
import { APP_MODULES } from "@/config/modules";
import { DashboardMetricCard } from "@/components/dashboard/dashboard-metrics";
import { EmptyPage } from "@/components/empty-page";
import { AdminInstitusiDashboard } from "./roles/admin-institusi-dashboard";
import { PelajarDashboard } from "./roles/pelajar-dashboard";
import { StandardDashboard } from "./roles/standard-dashboard";
import { SuperAdminPanels } from "./roles/super-admin-panels";
import { InstructorDashboard } from "./roles/instructor-dashboard";

const dashboardToday = new Date();
const dashboardDefaultStart = subDays(dashboardToday, 6);
const toDashboardIsoDate = (date?: Date) =>
  date ? format(date, "yyyy-MM-dd") : "";
const dashboardDateRangeLabel = (startDate: string, endDate: string) => {
  if (!startDate && !endDate) return "Pilih rentang tanggal";
  if (startDate && !endDate)
    return format(new Date(`${startDate}T00:00:00`), "dd MMM yyyy");
  return `${format(new Date(`${startDate}T00:00:00`), "dd MMM yyyy")} - ${format(new Date(`${endDate}T00:00:00`), "dd MMM yyyy")}`;
};

/**
 * NOTE: the response shape below is derived from the API contract you shared.
 * `data.data.{users,institutions,...}` come back as empty objects in every
 * sample payload, so their real (list) shape isn't defined yet — this file
 * intentionally doesn't render them. Once the backend fills those in, swap
 * the relevant panel's placeholder for a real list/table.
 * Consider moving these types into `@/lib/dto/dashboard` once confirmed.
 */

type DashboardRole =
  | "Super Admin"
  | "Admin Institusi"
  | "Instruktur"
  | "Pelajar"
  | "Dinas Pendidikan";

type MetricKey =
  | "total_users"
  | "total_institutions"
  | "total_learning_groups"
  | "total_learning_group_members"
  | "total_activities"
  | "total_quiz_sessions"
  | "total_attendance_logs";

interface DashboardSummary extends Record<MetricKey, number> {
  scope: string;
  region_level?: string;
  quiz_rankings_available: boolean;
}

interface DashboardRanking {
  rank: number;
  user_id: string;
  name: string;
  score: number;
  key?: string;
  items?: Record<string, unknown>[];
}

interface DashboardAlert {
  type: string;
  severity: "info" | "warning" | "critical";
  data: { id: string; title?: string; status?: string };
}

interface DashboardData {
  role?: string;
  role_label?: string;
  cached: boolean;
  generated_at: string;
  summary: DashboardSummary;
  rankings?: DashboardRanking[];
  alerts?: DashboardAlert[];
  data: Record<string, unknown>;
}

function normalizeDashboardRankings(
  dashboard: DashboardData,
): DashboardRanking[] {
  const candidates: unknown[] = [
    dashboard.rankings,
    dashboard.data?.rankings,
    dashboard.data?.quiz_rankings,
    dashboard.data?.student_rankings,
    dashboard.data?.top_students,
    dashboard.data?.student_achievements,
  ];
  const source = candidates.find(Array.isArray) as
    | Record<string, unknown>[]
    | undefined;

  // Institution dashboards return activity records in `rankings`, rather than
  // pre-aggregated quiz rankings. Convert those records into student totals.
  const activityRanking = (source ?? []).some(
    (item) => item.user_name !== undefined && item.point_value !== undefined,
  );
  const normalizedSource = activityRanking
    ? Object.values(
        (source ?? []).reduce<Record<string, Record<string, unknown>>>(
          (groups, item) => {
            const userId = String(item.user_id ?? item.user_name ?? item.id);
            const current = groups[userId] ?? {
              user_id: userId,
              name: item.user_name,
              score: 0,
            };
            current.score =
              Number(current.score ?? 0) + Number(item.point_value ?? 0);
            groups[userId] = current;
            return groups;
          },
          {},
        ),
      )
    : (source ?? []);

  return normalizedSource
    .map((item, index) => {
      const name = item.name ?? item.user_name ?? item.student_name;
      const score =
        item.score ??
        item.average_score ??
        item.total_score ??
        item.point_value;
      if (
        typeof name !== "string" ||
        !name.trim() ||
        score === undefined ||
        score === null
      ) {
        return null;
      }
      return {
        rank: Number(item.rank ?? index + 1),
        user_id: String(
          item.user_id ?? item.student_id ?? item.id ?? `${name}-${index}`,
        ),
        name: name.trim(),
        score: Number(score),
      };
    })
    .filter((item): item is DashboardRanking => item !== null)
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ ...item, rank: index + 1 }))
    .slice(0, 5);
}

type ActivityChartAggregate = {
  summary?: Record<string, unknown>;
  activities_by_item?: Array<Record<string, unknown>>;
  daily_trend?: Array<Record<string, unknown>>;
  top_teachers?: Array<Record<string, unknown>>;
};

function activityChartData(
  data: Record<string, unknown>,
  key: "positive_activity_chart" | "violation_activity_chart",
): ActivityChartAggregate {
  const value = data[key];
  return value && typeof value === "object"
    ? (value as ActivityChartAggregate)
    : {};
}

function formatDashboardDate(value: unknown) {
  const parts = String(value ?? "")
    .split("-")
    .map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN))
    return String(value ?? "-");
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(parts[0], parts[1] - 1, parts[2]));
}

function InstitutionActivityCharts({
  data,
}: {
  data: Record<string, unknown>;
}) {
  const positive = activityChartData(data, "positive_activity_chart");
  const violation = activityChartData(data, "violation_activity_chart");
  const lists = [
    {
      title: "Aktivitas positif teratas",
      items: positive.activities_by_item ?? [],
      color: "bg-emerald-500",
      empty: "Belum ada aktivitas positif.",
    },
    {
      title: "Pelanggaran teratas",
      items: violation.activities_by_item ?? [],
      color: "bg-rose-500",
      empty: "Belum ada pelanggaran.",
    },
  ];
  const trend = Object.values(
    [...(positive.daily_trend ?? []), ...(violation.daily_trend ?? [])].reduce<
      Record<string, Record<string, unknown>>
    >((days, item) => {
      const date = String(item.date ?? "");
      if (!date) return days;
      days[date] ??= { date, positive_activities: 0, violation_activities: 0 };
      days[date].positive_activities =
        Number(days[date].positive_activities ?? 0) +
        Number(item.positive_activities ?? 0);
      days[date].violation_activities =
        Number(days[date].violation_activities ?? 0) +
        Number(item.violation_activities ?? 0);
      return days;
    }, {}),
  )
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(-14);
  const chartTrend = trend.map((item) => ({
    ...item,
    date: formatDashboardDate(item.date),
  }));
  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {lists.map(({ title, items, color, empty }) => {
          const topItems = items.slice(0, 5);
          const max = Math.max(
            1,
            ...topItems.map((item) => Number(item.total_activities ?? 0)),
          );
          return (
            <section
              key={title}
              className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-white/10 dark:bg-white/[.03]"
            >
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Berdasarkan agregasi aktivitas dashboard
              </p>
              <div className="mt-5 space-y-4">
                {topItems.length ? (
                  topItems.map((item, index) => {
                    const total = Number(item.total_activities ?? 0);
                    return (
                      <div
                        key={String(
                          item.activity_item_id ??
                            `${item.activity_item_name}-${index}`,
                        )}
                      >
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate font-medium">
                            {String(item.activity_item_name ?? "Aktivitas")}
                          </span>
                          <span className="shrink-0 text-xs font-semibold text-zinc-500">
                            {total}x
                          </span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-zinc-100 dark:bg-white/10">
                          <div
                            className={`h-2 rounded-full ${color}`}
                            style={{
                              width: `${Math.max(4, (total / max) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-500 dark:border-white/10">
                    {empty}
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-white/10 dark:bg-white/[.03]">
        <h2 className="font-semibold">Tren aktivitas harian</h2>
        <p className="mt-1 text-xs text-zinc-500">
          14 hari terakhir dari data agregasi dashboard
        </p>
        <div className="mt-6 h-44">
          {chartTrend.length ? (
            <ChartContainer>
              <BarChart
                data={chartTrend}
                margin={{ top: 8, right: 8, left: -20, bottom: 12 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  angle={-20}
                  textAnchor="end"
                  height={52}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="positive_activities"
                  name="Positif"
                  fill="#10b981"
                  radius={[20, 20, 0, 0]}
                />
                <Bar
                  dataKey="violation_activities"
                  name="Pelanggaran"
                  fill="#f43f5e"
                  radius={[20, 20, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="flex h-full items-center justify-center text-xs text-zinc-500">
              Belum ada tren aktivitas.
            </p>
          )}
        </div>
        <div className="flex justify-center gap-5 text-xs text-zinc-500">
          <span>
            <i className="mr-1 inline-block size-2 rounded-full bg-emerald-500" />
            Positif
          </span>
          <span>
            <i className="mr-1 inline-block size-2 rounded-full bg-rose-500" />
            Pelanggaran
          </span>
        </div>
      </section>
    </section>
  );
}

type DashboardInsight = {
  id?: string;
  user_id?: string;
  user_name?: string;
  final_score?: number | string;
  category_id?: string;
  category_name?: string;
  name?: string;
  title?: string;
  subject?: string;
  teacher_name?: string;
  instructor_name?: string;
  score?: number;
  activity_count?: number;
  quiz_count?: number;
  violation_count?: number;
  total_activities?: number;
  student_count?: number;
  total_students?: number;
  learning_group_count?: number;
  total_learning_groups?: number;
  latitude?: number | string;
  longitude?: number | string;
  lat?: number | string;
  lng?: number | string;
  lon?: number | string;
  students_count?: number;
};

const fmt = new Intl.NumberFormat("id-ID");

const METRIC_META: Record<MetricKey, { label: string; icon: LucideIcon }> = {
  total_institutions: { label: "Institusi", icon: Building2 },
  total_users: { label: "Pengguna", icon: Users },
  total_learning_groups: { label: "Grup Pembelajaran", icon: Layers3 },
  total_learning_group_members: {
    label: "Anggota kelompok",
    icon: GraduationCap,
  },
  total_quiz_sessions: { label: "Sesi kuis", icon: BookOpen },
  total_activities: { label: "Aktivitas", icon: Activity },
  total_attendance_logs: { label: "Log kehadiran", icon: CalendarCheck },
};

// Which totals actually mean something to each role — a student doesn't
// need "total institutions" (always 1) and an instructor doesn't need
// platform-wide user counts they can't see anyway.
const ROLE_METRIC_KEYS: Record<DashboardRole, MetricKey[]> = {
  "Super Admin": [
    "total_institutions",
    "total_users",
    "total_learning_groups",
    "total_learning_group_members",
    "total_quiz_sessions",
    "total_activities",
    "total_attendance_logs",
  ],
  "Dinas Pendidikan": [
    "total_institutions",
    "total_users",
    "total_learning_groups",
    "total_learning_group_members",
    "total_quiz_sessions",
    "total_activities",
    "total_attendance_logs",
  ],
  "Admin Institusi": [
    "total_users",
    "total_learning_groups",
    "total_learning_group_members",
    "total_quiz_sessions",
    "total_activities",
    "total_attendance_logs",
  ],
  Instruktur: [
    "total_learning_groups",
    "total_learning_group_members",
    "total_quiz_sessions",
    "total_activities",
    "total_attendance_logs",
  ],
  Pelajar: [
    "total_learning_groups",
    "total_quiz_sessions",
    "total_activities",
    "total_attendance_logs",
  ],
};

const ROLE_COPY: Record<
  DashboardRole,
  { subtitle: string; heroLabel: string }
> = {
  "Super Admin": {
    heroLabel: "Ringkasan platform",
    subtitle: "Pantau seluruh ekosistem belajar di semua institusi.",
  },
  "Dinas Pendidikan": {
    heroLabel: "Ringkasan wilayah",
    subtitle: "Pantau capaian belajar di institusi wilayah Anda.",
  },
  "Admin Institusi": {
    heroLabel: "Ringkasan institusi",
    subtitle: "Pantau aktivitas belajar di institusi Anda.",
  },
  Instruktur: {
    heroLabel: "Ringkasan mengajar",
    subtitle: "Pantau grup belajar dan aktivitas yang Anda ampu.",
  },
  Pelajar: {
    heroLabel: "Progres belajar saya",
    subtitle: "Pantau capaian dan tugas yang perlu diselesaikan.",
  },
};

const ROLE_LABELS: Record<string, DashboardRole> = {
  super_admin: "Super Admin",
  admin_sekolah: "Admin Institusi",
  admin_institusi: "Admin Institusi",
  instructor: "Instruktur",
  teacher: "Instruktur",
  student: "Pelajar",
  pelajar: "Pelajar",
  dinas_pendidikan: "Dinas Pendidikan",
};

const ALERT_META: Record<string, { label: string; icon: LucideIcon }> = {
  unfinished_quiz: { label: "Kuis belum diselesaikan", icon: BookOpen },
  attendance: { label: "Kehadiran perlu diperiksa", icon: CalendarCheck },
  submission: { label: "Pengajuan menunggu tinjauan", icon: Info },
};

const SEVERITY_STYLE: Record<
  DashboardAlert["severity"],
  { icon: LucideIcon; wrap: string; iconColor: string }
> = {
  info: {
    icon: Info,
    wrap: "bg-blue-50 dark:bg-blue-950/20",
    iconColor: "text-blue-600",
  },
  warning: {
    icon: AlertTriangle,
    wrap: "bg-amber-50 dark:bg-amber-950/20",
    iconColor: "text-amber-600",
  },
  critical: {
    icon: ShieldAlert,
    wrap: "bg-rose-50 dark:bg-rose-950/20",
    iconColor: "text-rose-600",
  },
};

const BAR_COLORS = [
  ["#2563eb", "#22d3ee"],
  ["#7c3aed", "#e879f9"],
  ["#059669", "#2dd4bf"],
  ["#ea580c", "#fbbf24"],
  ["#db2777", "#fb7185"],
  ["#0891b2", "#67e8f9"],
  ["#4f46e5", "#a5b4fc"],
] as const;

function normalizeRole(
  value: unknown,
  user: ReturnType<typeof getAuthUser>,
): DashboardRole | null {
  const role = String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
  const type = String(user?.type ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
  const sessionRole = getRoleName(user);
  const identity = `${role} ${sessionRole} ${type}`;

  if (identity.includes("super_admin") || identity.includes("owner"))
    return "Super Admin";
  if (identity.includes("dinas_pendidikan") || identity.includes("dinas"))
    return "Dinas Pendidikan";
  if (
    identity.includes("student") ||
    identity.includes("siswa") ||
    identity.includes("pelajar")
  )
    return "Pelajar";
  if (
    identity.includes("teacher") ||
    identity.includes("guru") ||
    identity.includes("instructor") ||
    identity.includes("instruktur")
  )
    return "Instruktur";
  if (
    identity.includes("admin") ||
    identity.includes("staff") ||
    identity.includes("staf")
  )
    return "Admin Institusi";
  return null;
}

function displayRoleLabel(
  value: unknown,
  fallback: DashboardRole | null,
): string {
  const normalized = String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
  return ROLE_LABELS[normalized] ?? fallback ?? "Dashboard";
}

function modelFromModuleHref(href: string) {
  const path = href.split("?")[0].replace(/^\//, "");
  return path === "attendances" ? "attendance-logs" : path;
}

function MetricDistribution({
  summary,
  keys,
  title,
  description,
}: {
  summary: DashboardSummary;
  keys: MetricKey[];
  title: string;
  description: string;
}) {
  const bars = keys.map((key) => ({
    key,
    label: METRIC_META[key].label,
    value: summary[key],
  }));
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-white/10 dark:bg-white/[.03]">
      <div className="flex justify-between">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-xs text-zinc-500">{description}</p>
        </div>
        <Activity className="size-5 text-blue-500" />
      </div>
      <div className="mt-6 flex h-56 flex-wrap items-end gap-3 sm:gap-4">
        {bars.map((bar, index) => (
          <div
            key={bar.key}
            className="flex min-w-14 flex-1 flex-col items-center gap-2"
          >
            <span className="text-[10px] font-semibold text-zinc-500">
              {fmt.format(bar.value)}
            </span>
            <div className="flex h-40 w-full items-end rounded-lg bg-zinc-100 p-1 dark:bg-white/5">
              <div
                className="w-full rounded-md"
                style={{
                  minHeight: 12,
                  height: `${Math.max(12, (bar.value / max) * 100)}%`,
                  background: `linear-gradient(180deg, ${BAR_COLORS[index % BAR_COLORS.length][1]}, ${BAR_COLORS[index % BAR_COLORS.length][0]})`,
                }}
              />
            </div>
            <span className="line-clamp-2 text-center text-[10px] text-zinc-500">
              {bar.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertsPanel({
  alerts,
  role,
}: {
  alerts: DashboardAlert[];
  role: DashboardRole | null;
}) {
  const uniqueAlerts = alerts.filter((alert, index, all) => {
    const key = `${alert.type}-${alert.data?.title ?? ""}-${alert.data?.status ?? ""}`;
    return (
      all.findIndex(
        (item) =>
          `${item.type}-${item.data?.title ?? ""}-${item.data?.status ?? ""}` ===
          key,
      ) === index
    );
  });

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-white/10 dark:bg-white/[.03]">
      <div className="flex justify-between">
        <div>
          <h2 className="font-semibold">Perlu perhatian</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Ringkasan hal yang perlu ditindaklanjuti
          </p>
        </div>
        <CircleCheck className="size-5 text-emerald-500" />
      </div>
      <div className="mt-6 space-y-3">
        {uniqueAlerts.length ? (
          uniqueAlerts.slice(0, 4).map((alert) => {
            const meta =
              alert.type === "attendance" && role === "Admin Institusi"
                ? {
                    label: "Periksa kehadiran di institusi",
                    icon: CalendarCheck,
                  }
                : (ALERT_META[alert.type] ?? {
                    label:
                      role === "Admin Institusi"
                        ? "Ada data institusi yang perlu diperiksa"
                        : "Ada informasi yang perlu diperiksa",
                    icon: Info,
                  });
            const severity =
              SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE.info;
            const SeverityIcon = severity.icon;
            return (
              <div
                key={`${alert.type}-${alert.data?.id}`}
                className={`flex items-center gap-3 rounded-xl p-4 ${severity.wrap}`}
              >
                <SeverityIcon className={`size-5 ${severity.iconColor}`} />
                <div>
                  <p className="text-sm font-medium">{meta.label}</p>
                  {alert.data?.title ? (
                    <p className="text-xs text-zinc-500">{alert.data.title}</p>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-200 p-5 text-center text-sm text-zinc-500 dark:border-white/10">
            Tidak ada peringatan saat ini.
          </div>
        )}
      </div>
    </div>
  );
}

function RankingsPanel({ rankings }: { rankings: DashboardRanking[] }) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-white/10 dark:bg-white/[.03]">
      <div className="flex items-center gap-2">
        <Trophy className="size-5 text-amber-500" />
        <h2 className="font-semibold">Peringkat kuis</h2>
      </div>
      <div className="mt-4 space-y-2">
        {rankings.length ? (
          rankings.slice(0, 5).map((rank) => (
            <div
              key={rank.user_id}
              className="flex items-center justify-between rounded-xl bg-zinc-50 p-4 text-sm dark:bg-white/5"
            >
              <span className="flex items-center gap-2 font-medium">
                {rank.rank <= 3 ? (
                  <Award
                    className={`size-4 ${
                      rank.rank === 1
                        ? "text-amber-500"
                        : rank.rank === 2
                          ? "text-zinc-400"
                          : "text-orange-700"
                    }`}
                  />
                ) : (
                  <span className="w-4 text-center text-zinc-400">
                    {rank.rank}
                  </span>
                )}
                {rank.name}
              </span>
              <b className="text-blue-600">{rank.score}</b>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-200 p-5 text-center text-sm text-zinc-500 dark:border-white/10">
            Belum ada peringkat untuk ditampilkan.
          </div>
        )}
      </div>
    </div>
  );
}

function insightList(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value)) return value as DashboardInsight[];
    if (value && typeof value === "object") {
      const nested = (value as { data?: unknown }).data;
      if (Array.isArray(nested)) return nested as DashboardInsight[];
    }
  }
  return [];
}

function InsightList({
  title,
  description,
  icon: Icon,
  items,
  emptyMessage,
  renderItem,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  items: DashboardInsight[];
  emptyMessage: string;
  renderItem: (item: DashboardInsight, index: number) => React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-white/10 dark:bg-white/[.03]">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
          <Icon className="size-4" />
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-xs text-zinc-500">{description}</p>
        </div>
      </div>
      <div className="mt-5 space-y-2">
        {items.length ? (
          items.slice(0, 5).map(renderItem)
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-500 dark:border-white/10">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}

function SchoolInsightsPanel({
  data,
  rankings,
}: {
  data: Record<string, unknown>;
  rankings: DashboardRanking[];
}) {
  const groups = insightList(data, [
    "active_learning_groups",
    "learning_groups",
    "groups",
    "subjects",
  ]);
  const activeTeachers = insightList(data, [
    "active_teachers",
    "teacher_activity",
    "teachers",
  ]);
  const topStudents = insightList(data, [
    "top_students",
    "student_achievements",
    "student_rankings",
  ]);
  const positiveChart = activityChartData(data, "positive_activity_chart");
  const chartTopTeachers = positiveChart.top_teachers ?? [];
  const displayedActiveTeachers = chartTopTeachers.length
    ? chartTopTeachers.map((item) => ({
        id: item.user_id ? String(item.user_id) : undefined,
        name: item.user_name ? String(item.user_name) : undefined,
        activity_count: Number(item.total_activities ?? 0),
      }))
    : activeTeachers;
  const chartTopStudents =
    (
      positiveChart as ActivityChartAggregate & {
        top_students?: Array<Record<string, unknown>>;
      }
    ).top_students ?? [];
  const quizSessions = insightList(data, ["quiz_sessions"]);
  const quizStudents = Object.values(quizSessions.reduce<Record<string, DashboardInsight[]>>((groups, session) => {
    const userId = String(session.user_id ?? session.user_name ?? "");
    if (userId) (groups[userId] ??= []).push(session);
    return groups;
  }, {})).map((sessions) => {
    const scores = sessions.map((session) => Number(session.score ?? session.final_score)).filter(Number.isFinite);
    return { id: sessions[0].user_id, name: sessions[0].user_name, score: scores.length ? scores.reduce((total, score) => total + score, 0) / scores.length : 0, quiz_count: scores.length };
  }).filter((student) => student.name && student.quiz_count);
  const students = (
    quizStudents.length
      ? quizStudents
      : topStudents.length
      ? topStudents
      : chartTopStudents.length
        ? chartTopStudents.map((item) => ({
            id: item.user_id ? String(item.user_id) : undefined,
            name: item.user_name ? String(item.user_name) : undefined,
            score: Number(item.total_points ?? item.total_activities ?? 0),
            activity_count: Number(item.total_activities ?? 0),
          }))
        : rankings
  ).filter(
    (item) =>
      typeof item.name === "string" &&
      item.name.trim() &&
      item.score !== undefined,
  );
  const activeStudents = chartTopStudents
    .map((item) => ({
      id: item.user_id ? String(item.user_id) : undefined,
      name: item.user_name ? String(item.user_name).trim() : undefined,
      activity_count: Number(item.total_activities ?? 0),
    }))
    .filter((student) => student.name && student.activity_count > 0);
  const violationChart = activityChartData(data, "violation_activity_chart");
  const violationTopStudents = (violationChart as ActivityChartAggregate & {
    top_students?: Array<Record<string, unknown>>;
  }).top_students ?? [];
  const frequentViolators = violationTopStudents
    .map((item) => ({
      id: item.user_id ? String(item.user_id) : undefined,
      name: item.user_name ? String(item.user_name).trim() : undefined,
      violation_count: Number(item.total_activities ?? 0),
    }))
    .filter((student) => student.name && student.violation_count > 0);

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <InsightList
        title="Grup belajar aktif"
        description="Mata pelajaran dan guru pengajar"
        icon={Layers3}
        items={groups}
        emptyMessage="Data grup belajar belum tersedia."
        renderItem={(item, index) => (
          <div
            key={item.id ?? `${item.title}-${index}`}
            className="rounded-xl bg-zinc-50 p-3 dark:bg-white/5"
          >
            <p className="text-sm font-medium">
              {item.subject ?? item.title ?? item.name ?? "Grup belajar"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Guru: {item.teacher_name ?? item.instructor_name ?? "Belum ditentukan"}
            </p>
          </div>
        )}
      />
      <InsightList
        title="Guru paling aktif"
        description="Berdasarkan aktivitas penggunaan sistem"
        icon={Users}
        items={displayedActiveTeachers}
        emptyMessage="Data aktivitas guru belum tersedia."
        renderItem={(item, index) => (
          <div
            key={item.id ?? `${item.name}-${index}`}
            className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-white/5"
          >
            <span className="text-sm font-medium">
              {item.name ?? item.teacher_name ?? "Guru"}
            </span>
            <span className="text-xs font-semibold text-blue-600">
              {fmt.format(item.activity_count ?? item.total_activities ?? 0)}{" "}
              aktivitas
            </span>
          </div>
        )}
      />
      <InsightList
        title="Siswa berprestasi"
        description="Peringkat capaian belajar terbaru"
        icon={Trophy}
        items={students}
        emptyMessage="Data prestasi siswa belum tersedia."
        renderItem={(item, index) => (
          <div
            key={item.id ?? `${item.name}-${index}`}
            className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-white/5"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Award className="size-4 text-amber-500" />
              {item.name ?? "Siswa"}
            </span>
            <span className="text-xs font-semibold text-blue-600">
              {item.quiz_count !== undefined
                ? `Nilai rata-rata ${item.score?.toFixed(0)}`
                : item.activity_count !== undefined
                ? `${item.activity_count} aktivitas`
                : `Nilai ${item.score ?? "-"}`}
            </span>
          </div>
        )}
      />
      <InsightList
        title="Siswa paling aktif"
        description="Berdasarkan jumlah aktivitas"
        icon={Activity}
        items={activeStudents}
        emptyMessage="Data aktivitas siswa belum tersedia."
        renderItem={(item, index) => (
          <div
            key={item.id ?? `${item.name}-${index}`}
            className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-white/5"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Activity className="size-4 text-blue-500" />
              {item.name ?? "Siswa"}
            </span>
            <span className="text-xs font-semibold text-blue-600">
              {item.activity_count} aktivitas
            </span>
          </div>
        )}
      />
      <InsightList
        title="Siswa sering melanggar"
        description="Berdasarkan jumlah pelanggaran"
        icon={AlertTriangle}
        items={frequentViolators}
        emptyMessage="Belum ada data pelanggaran siswa."
        renderItem={(item, index) => (
          <div
            key={item.id ?? `${item.name}-${index}`}
            className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-white/5"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="size-4 text-rose-500" />
              {item.name ?? "Siswa"}
            </span>
            <span className="text-xs font-semibold text-rose-600">
              {item.violation_count} pelanggaran
            </span>
          </div>
        )}
      />
    </section>
  );
}

export function SuperAdminInstitutionRankings({
  data,
}: {
  data: Record<string, unknown>;
}) {
  const institutions = insightList(data, [
    "institutions",
    "institution_rankings",
  ]);
  const byStudents = insightList(data, [
    "top_institutions_by_students",
    "institutions_by_students",
    "top_student_institutions",
  ]);
  const byActivity = insightList(data, [
    "top_institutions_by_activity",
    "top_institutions_by_activities",
    "institutions_by_activity",
    "most_active_institutions",
  ]);
  const byGroups = insightList(data, [
    "top_institutions_by_learning_groups",
    "top_institutions_by_groups",
    "institutions_by_learning_groups",
  ]);

  const getRanking = (items: DashboardInsight[], valueKeys: string[]) => {
    const source = items.length ? items : institutions;
    return source
      .map((item) => ({
        ...item,
        value:
          valueKeys.reduce<number | undefined>(
            (value, key) =>
              value ??
              ((item as Record<string, unknown>)[key] as number | undefined),
            undefined,
          ) ?? 0,
      }))
      .sort((a, b) => b.value - a.value);
  };

  const panels = [
    {
      title: "Top institusi siswa terbanyak",
      description: "Berdasarkan jumlah siswa terdaftar",
      icon: GraduationCap,
      items: getRanking(byStudents, [
        "student_count",
        "total_students",
        "students_count",
      ]),
      suffix: "siswa",
    },
    {
      title: "Top institusi paling aktif",
      description: "Berdasarkan aktivitas pada periode terpilih",
      icon: Activity,
      items: getRanking(byActivity, [
        "activity_count",
        "total_activities",
        "activities_count",
      ]),
      suffix: "aktivitas",
    },
    {
      title: "Top institusi grup terbanyak",
      description: "Berdasarkan jumlah grup pembelajaran",
      icon: Layers3,
      items: getRanking(byGroups, [
        "learning_group_count",
        "total_learning_groups",
        "groups_count",
      ]),
      suffix: "grup",
    },
  ];

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      {panels.map(({ title, description, icon: Icon, items, suffix }) => (
        <InsightList
          key={title}
          title={title}
          description={description}
          icon={Icon}
          items={items}
          emptyMessage="Data ranking institusi belum tersedia."
          renderItem={(item, index) => (
            <div
              key={item.id ?? `${item.name}-${index}`}
              className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-white/5"
            >
              <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-blue-100 text-xs text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  {index + 1}
                </span>
                <span className="truncate">
                  {item.name ?? item.title ?? "Institusi"}
                </span>
              </span>
              <span className="ml-2 shrink-0 text-xs font-semibold text-blue-600">
                {fmt.format(
                  (item as DashboardInsight & { value: number }).value,
                )}{" "}
                {suffix}
              </span>
            </div>
          )}
        />
      ))}
    </section>
  );
}

export function InstitutionMapPanel({
  data,
}: {
  data: Record<string, unknown>;
}) {
  const institutions = insightList(data, [
    "institution_locations",
    "institutions_locations",
    "institutions",
  ]).flatMap((item) => {
    const latitude = Number(item.latitude ?? item.lat);
    const longitude = Number(item.longitude ?? item.lng ?? item.lon);
    return Number.isFinite(latitude) && Number.isFinite(longitude)
      ? [{ ...item, latitude, longitude }]
      : [];
  });
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-white/10 dark:bg-white/[.03]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Peta sebaran institusi</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Lokasi institusi dan jumlah siswa terdaftar
          </p>
        </div>
        <Building2 className="size-5 text-blue-500" />
      </div>
      <div className="relative mt-5 overflow-hidden rounded-xl border border-blue-100 bg-sky-50 dark:border-blue-950/50 dark:bg-sky-950/20">
        <MapContainer
          center={[-2.5, 118]}
          zoom={4}
          className="dashboard-map h-80 w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {institutions.map((institution, index) => {
            const students = Number(
              institution.student_count ??
                institution.total_students ??
                institution.students_count ??
                0,
            );
            return (
              <CircleMarker
                key={institution.id ?? `${institution.name}-${index}`}
                center={[institution.latitude, institution.longitude]}
                radius={Math.max(7, Math.min(18, 7 + students / 100))}
                pathOptions={{
                  color: "#1d4ed8",
                  fillColor: "#2563eb",
                  fillOpacity: 0.75,
                }}
              >
                <Popup>
                  <strong>{institution.name ?? "Institusi"}</strong>
                  <br />
                  {fmt.format(students)} siswa
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
        {!institutions.length ? (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-zinc-500">
            Data koordinat institusi belum tersedia.
          </div>
        ) : null}
      </div>
      {institutions.length ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {institutions.slice(0, 6).map((institution, index) => (
            <div
              key={institution.id ?? `${institution.name}-${index}`}
              className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-xs dark:bg-white/5"
            >
              <span className="truncate font-medium">
                {institution.name ?? "Institusi"}
              </span>
              <span className="ml-2 shrink-0 text-blue-600">
                {fmt.format(
                  Number(
                    institution.student_count ??
                      institution.total_students ??
                      institution.students_count ??
                      0,
                  ),
                )}{" "}
                siswa
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function DashboardContent() {
  const user = getAuthUser();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({
    period: "custom",
    startDate: toDashboardIsoDate(dashboardDefaultStart),
    endDate: toDashboardIsoDate(dashboardToday),
    learningGroupId: "",
    categoryId: "",
  });

  const load = async (requestFilters?: DashboardFilters) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await Promise.race([
        fetchDashboard(requestFilters),
        new Promise<never>((_, reject) =>
          window.setTimeout(
            () => reject(new Error("Permintaan dashboard terlalu lama.")),
            15000,
          ),
        ),
      ]);
      setDashboard(res.data as unknown as DashboardData);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Dashboard gagal dimuat. Periksa koneksi ke server.";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const task = window.setTimeout(() => void load({
      period: "custom",
      startDate: toDashboardIsoDate(dashboardDefaultStart),
      endDate: toDashboardIsoDate(dashboardToday),
      learningGroupId: "",
      categoryId: "",
    }), 0);
    return () => window.clearTimeout(task);
  }, []);

  // `role` is the stable machine value for permissions and branching.
  // `role_label` is supplied by the backend and is only used for UI copy.
  const role = normalizeRole(dashboard?.role, user);
  const metricKeys =
    role && ROLE_METRIC_KEYS[role] ? ROLE_METRIC_KEYS[role] : [];

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[1440px] space-y-5 px-5 py-6 sm:px-8 lg:px-10">
        <Skeleton className="h-36 rounded-3xl" />
        <section className="rounded-2xl border border-zinc-200/80 p-5 dark:border-white/10">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="mt-2 h-4 w-72" />
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-md" />
            ))}
          </div>
        </section>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-32 rounded-2xl" />
      </main>
    );
  }

  if (!dashboard) {
    return (
      <EmptyPage
        title="Dashboard belum tersedia"
        description="Data dashboard belum dapat diambil. Periksa koneksi Anda lalu coba lagi."
        detail={loadError}
        action={<Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => void load(filters)}>Coba lagi</Button>}
      />
    );
  }

  const { summary } = dashboard;
  const alerts = dashboard.alerts ?? [];
  const rankings = normalizeDashboardRankings(dashboard);
  const positiveActivityChart = activityChartData(dashboard.data ?? {}, "positive_activity_chart");
  const violationActivityChart = activityChartData(dashboard.data ?? {}, "violation_activity_chart");
  const periodActivities = Number(positiveActivityChart.summary?.total_activities ?? 0) + Number(violationActivityChart.summary?.total_activities ?? 0);
  const periodAttendanceLogs = insightList(dashboard.data ?? {}, ["attendance"]).length;
  const periodSummary = {
    ...summary,
    total_activities: positiveActivityChart.summary || violationActivityChart.summary ? periodActivities : summary.total_activities,
    total_attendance_logs: dashboard.data?.attendance && typeof dashboard.data.attendance === "object" ? periodAttendanceLogs : summary.total_attendance_logs,
  };
  const superAdminData = {
    ...dashboard.data,
    institution_map: dashboard.data?.institution_map ??
      (dashboard.data?.data && typeof dashboard.data.data === "object"
        ? (dashboard.data.data as Record<string, unknown>).institution_map
        : undefined),
    top_institutions_by_students: dashboard.rankings?.find(
      (ranking) => ranking.key === "top_institutions_by_students",
    )?.items,
    top_institutions_by_activity: dashboard.rankings?.find(
      (ranking) => ranking.key === "top_institutions_by_activity",
    )?.items,
    top_institutions_by_learning_groups: dashboard.rankings?.find(
      (ranking) => ranking.key === "top_institutions_by_groups",
    )?.items,
  };
  const learningGroups = insightList(dashboard.data ?? {}, ["learning_groups"]);
  const activities = insightList(dashboard.data ?? {}, ["activities"]);
  const categories = Array.from(
    new Map(
      activities.map((item) => [
        String(item.category_id ?? ""),
        item.category_name,
      ]),
    ).entries(),
  )
    .filter(([id, name]) => id && name)
    .map(([id, name]) => ({ id, name: String(name) }));
  const selectedGroup = learningGroups.find(
    (group) => String(group.id) === filters.learningGroupId,
  );
  const selectedCategory = categories.find(
    (category) => category.id === filters.categoryId,
  );
  const copy = (role && ROLE_COPY[role]) || {
    heroLabel: "Ringkasan dashboard",
    subtitle: "Pantau aktivitas Anda.",
  };
  const roleLabel = displayRoleLabel(dashboard.role_label, role);
  const institutionName = user?.institution?.name;
  const institutionLogoUrl =
    user?.institution?.file_url ?? user?.institution?.avatar_url;
  const isAdminRole =
    role === "Super Admin" ||
    role === "Admin Institusi" ||
    role === "Dinas Pendidikan";
  const isPelajar = role === "Pelajar";
  const quickAccessModules = APP_MODULES.filter(({ href, roles }) => {
    const roleName = getRoleName(user);
    const allowedByRole = !roles?.length || roles.includes(roleName);
    return allowedByRole && canReadModel(modelFromModuleHref(href));
  }).slice(0, 4);

  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-6 px-5 py-6 sm:px-8 lg:px-10">
      <section
        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-blue-900/20 sm:p-8"
        style={{
          background:
            "linear-gradient(120deg, #123a8c 0%, #3158c8 55%, #6336b7 100%)",
        }}
      >
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-100">
              Selamat datang, {institutionName || "Institusi"} -{" "}
              {roleLabel === "Dashboard" ? "Pengguna" : roleLabel}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {user?.name || "Pengguna"}
            </h1>
            <p className="mt-2 text-sm text-blue-100">{copy.subtitle}</p>
          </div>
          {institutionLogoUrl ? (
            <img
              src={institutionLogoUrl}
              alt={
                institutionName ? `Logo ${institutionName}` : "Logo institusi"
              }
              className="size-16 shrink-0 rounded-2xl border border-white/30 bg-white object-contain p-2 shadow-lg sm:size-[4.5rem]"
            />
          ) : null}
        </div>
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border-[36px] border-white/10" />
      </section>

      {
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[.03]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Filter dashboard</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Pilih cakupan data yang ingin ditampilkan.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const resetFilters = {
                  period: "custom",
                  startDate: toDashboardIsoDate(dashboardDefaultStart),
                  endDate: toDashboardIsoDate(dashboardToday),
                  learningGroupId: "",
                  categoryId: "",
                };
                setFilters(resetFilters);
                void load(resetFilters);
              }}
            >
              <RotateCcw className="mr-2 size-4" /> Reset
            </Button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="dashboard-date-range">Periode</Label>
              <Popover>
                <PopoverTrigger
                  id="dashboard-date-range"
                  render={
                    <Button
                      variant="outline"
                      className="h-9 w-full justify-start px-3 text-left font-normal"
                    />
                  }
                >
                  {dashboardDateRangeLabel(filters.startDate, filters.endDate)}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{
                      from: filters.startDate
                        ? new Date(`${filters.startDate}T00:00:00`)
                        : undefined,
                      to: filters.endDate
                        ? new Date(`${filters.endDate}T00:00:00`)
                        : undefined,
                    }}
                    onSelect={(range: DateRange | undefined) =>
                      setFilters((current) => ({
                        ...current,
                        period: "custom",
                        startDate: toDashboardIsoDate(range?.from),
                        endDate: toDashboardIsoDate(range?.to),
                      }))
                    }
                    numberOfMonths={2}
                    defaultMonth={dashboardDefaultStart}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dashboard-learning-group">Grup belajar</Label>
              <Select
                value={filters.learningGroupId || undefined}
                onValueChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    learningGroupId: !value || value === "all" ? "" : value,
                  }))
                }
              >
                <SelectTrigger
                  id="dashboard-learning-group"
                  className="!h-9 w-full"
                >
                  <SelectValue>
                    {selectedGroup
                      ? String(
                          selectedGroup.name ??
                            selectedGroup.title ??
                            "Grup belajar",
                        )
                      : "Semua grup"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua grup</SelectItem>
                  {learningGroups.map((group) => (
                    <SelectItem key={String(group.id)} value={String(group.id)}>
                      {String(group.name ?? group.title ?? "Grup belajar")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dashboard-category">Kategori aktivitas</Label>
              <Select
                value={filters.categoryId || undefined}
                onValueChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    categoryId: !value || value === "all" ? "" : value,
                  }))
                }
              >
                <SelectTrigger id="dashboard-category" className="!h-9 w-full">
                  <SelectValue>
                    {selectedCategory?.name ?? "Semua kategori"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua kategori</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              className="p-4 bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => void load(filters)}
            >
              Terapkan filter
            </Button>
          </div>
        </section>
      }

      <section>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-12">
          {metricKeys.map((key, index) => {
            const isSevenMetrics = metricKeys.length === 7;
            const columnSpan = isSevenMetrics
              ? index < 4
                ? "xl:col-span-3"
                : "xl:col-span-4"
              : metricKeys.length === 6
                ? "xl:col-span-4"
                : metricKeys.length === 5
                  ? index < 3
                    ? "xl:col-span-4"
                    : "xl:col-span-6"
                  : "xl:col-span-3";
            return (
              <div key={key} className={columnSpan}>
                <DashboardMetricCard
                  metricKey={key}
                  value={periodSummary[key]}
                  contextLabel={
                    key === "total_activities" || key === "total_attendance_logs"
                      ? "Periode"
                      : undefined
                  }
                />
              </div>
            );
          })}
        </div>
      </section>

      {role === "Super Admin" ? (
        <SuperAdminPanels data={superAdminData} />
      ) : role === "Admin Institusi" ? (
        <>
          <AdminInstitusiDashboard>
            <SchoolInsightsPanel
              data={dashboard.data ?? {}}
              rankings={rankings}
            />
            <InstitutionActivityCharts data={dashboard.data ?? {}} />
          </AdminInstitusiDashboard>
        </>
      ) : role === "Instruktur" ? (
        <InstructorDashboard
          summary={summary as unknown as Record<string, unknown>}
          data={dashboard.data ?? {}}
        />
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {isPelajar ? (
            <PelajarDashboard>
              <RankingsPanel rankings={rankings} />
            </PelajarDashboard>
          ) : (
            <StandardDashboard>
              <MetricDistribution
                summary={summary}
                keys={metricKeys}
                title={
                  isAdminRole
                    ? "Distribusi ekosistem"
                    : "Ringkasan grup belajar"
                }
                description={
                  isAdminRole
                    ? "Perbandingan metrik utama pada cakupan Anda"
                    : "Aktivitas pada grup belajar yang Anda ampu"
                }
              />
            </StandardDashboard>
          )}
          <AlertsPanel role={role} alerts={alerts} />
        </section>
      )}

      {role !== "Super Admin" &&
      !isPelajar &&
      summary.quiz_rankings_available ? (
        <RankingsPanel rankings={rankings} />
      ) : null}

      {quickAccessModules.length ? (
        <section>
          <div className="mb-4 flex justify-between">
            <div>
              <h2 className="font-semibold">Akses cepat</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Lanjutkan pekerjaan Anda
              </p>
            </div>
            <Link to="/dashboard" className="text-xs font-medium text-blue-600">
              Lihat semua
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickAccessModules.map(
              ({ href, title, description, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  className="group rounded-2xl border border-zinc-200/80 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg dark:border-white/10 dark:bg-white/[.03]"
                >
                  <div className="flex justify-between">
                    <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                      <Icon className="size-[18px]" />
                    </span>
                    <ChevronRight className="size-4 text-zinc-300 transition-transform group-hover:translate-x-1" />
                  </div>
                  <h3 className="mt-5 text-sm font-semibold">{title}</h3>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-zinc-500">
                    {description}
                  </p>
                </Link>
              ),
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
