import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { canReadModel, getAuthUser, getRoleName } from "@/lib/auth/session";
import { fetchDashboard } from "../actions";
import type { DashboardFilters } from "../actions";
import { APP_MODULES } from "@/config/modules";
import { DashboardMetricCard } from "@/components/dashboard/dashboard-metrics";
import { AdminInstitusiDashboard } from "./roles/admin-institusi-dashboard";
import { PelajarDashboard } from "./roles/pelajar-dashboard";
import { StandardDashboard } from "./roles/standard-dashboard";
import { SuperAdminPanels } from "./roles/super-admin-panels";

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
}

interface DashboardAlert {
  type: string;
  severity: "info" | "warning" | "critical";
  data: { id: string; title?: string; status?: string };
}

interface DashboardData {
  role: string;
  role_label?: string;
  cached: boolean;
  generated_at: string;
  summary: DashboardSummary;
  rankings?: DashboardRanking[];
  alerts?: DashboardAlert[];
  data: Record<string, unknown>;
}

type DashboardInsight = {
  id?: string;
  name?: string;
  title?: string;
  subject?: string;
  teacher_name?: string;
  score?: number;
  activity_count?: number;
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
  total_activities: { label: "Aktivitas", icon: Activity },
  total_quiz_sessions: { label: "Sesi kuis", icon: BookOpen },
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
    "total_activities",
    "total_quiz_sessions",
    "total_attendance_logs",
  ],
  "Dinas Pendidikan": [
    "total_institutions",
    "total_users",
    "total_learning_groups",
    "total_learning_group_members",
    "total_activities",
    "total_quiz_sessions",
    "total_attendance_logs",
  ],
  "Admin Institusi": [
    "total_users",
    "total_learning_groups",
    "total_learning_group_members",
    "total_activities",
    "total_quiz_sessions",
    "total_attendance_logs",
  ],
  Instruktur: [
    "total_learning_groups",
    "total_learning_group_members",
    "total_activities",
    "total_quiz_sessions",
    "total_attendance_logs",
  ],
  Pelajar: [
    "total_learning_groups",
    "total_activities",
    "total_quiz_sessions",
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

const DASHBOARD_PERIOD_LABELS: Record<string, string> = {
  today: "Hari ini",
  this_week: "Minggu ini",
  this_month: "Bulan ini",
  this_year: "Tahun ini",
  custom: "Rentang tanggal",
};

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
  const identity = `${role} ${type}`;

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
  const groups = insightList(data, ["learning_groups", "groups", "subjects"]);
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
  const students = topStudents.length
    ? topStudents
    : rankings.map((item) => ({
        id: item.user_id,
        name: item.name,
        score: item.score,
      }));

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
              Guru: {item.teacher_name ?? "Belum ditentukan"}
            </p>
          </div>
        )}
      />
      <InsightList
        title="Guru paling aktif"
        description="Berdasarkan aktivitas penggunaan sistem"
        icon={Users}
        items={activeTeachers}
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
              Nilai {item.score ?? "-"}
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
  const institutions = insightList(data, ["institutions", "institution_rankings"]);
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
        value: valueKeys.reduce<number | undefined>(
          (value, key) => value ?? (item as Record<string, unknown>)[key] as number | undefined,
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
      items: getRanking(byStudents, ["student_count", "total_students", "students_count"]),
      suffix: "siswa",
    },
    {
      title: "Top institusi paling aktif",
      description: "Berdasarkan aktivitas pada periode terpilih",
      icon: Activity,
      items: getRanking(byActivity, ["activity_count", "total_activities", "activities_count"]),
      suffix: "aktivitas",
    },
    {
      title: "Top institusi grup terbanyak",
      description: "Berdasarkan jumlah grup pembelajaran",
      icon: Layers3,
      items: getRanking(byGroups, ["learning_group_count", "total_learning_groups", "groups_count"]),
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
                <span className="truncate">{item.name ?? item.title ?? "Institusi"}</span>
              </span>
              <span className="ml-2 shrink-0 text-xs font-semibold text-blue-600">
                {fmt.format((item as DashboardInsight & { value: number }).value)} {suffix}
              </span>
            </div>
          )}
        />
      ))}
    </section>
  );
}

export function InstitutionMapPanel({ data }: { data: Record<string, unknown> }) {
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
        <MapContainer center={[-2.5, 118]} zoom={4} className="h-80 w-full" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {institutions.map((institution, index) => {
            const students = Number(institution.student_count ?? institution.total_students ?? institution.students_count ?? 0);
            return (
              <CircleMarker
                key={institution.id ?? `${institution.name}-${index}`}
                center={[institution.latitude, institution.longitude]}
                radius={Math.max(7, Math.min(18, 7 + students / 100))}
                pathOptions={{ color: "#1d4ed8", fillColor: "#2563eb", fillOpacity: 0.75 }}
              >
                <Popup>
                  <strong>{institution.name ?? "Institusi"}</strong><br />
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
            <div key={institution.id ?? `${institution.name}-${index}`} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-xs dark:bg-white/5">
              <span className="truncate font-medium">{institution.name ?? "Institusi"}</span>
              <span className="ml-2 shrink-0 text-blue-600">{fmt.format(Number(institution.student_count ?? institution.total_students ?? institution.students_count ?? 0))} siswa</span>
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
    period: "this_month",
    startDate: "",
    endDate: "",
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
      toast.error(
        message,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, []);

  // `role` is the stable machine value for permissions and branching.
  // `role_label` is supplied by the backend and is only used for UI copy.
  const role = normalizeRole(dashboard?.role, user);
  const metricKeys = role && ROLE_METRIC_KEYS[role] ? ROLE_METRIC_KEYS[role] : [];

  if (loading) {
    return (
      <main className="mx-auto max-w-[1440px] space-y-6 px-5 py-6 sm:px-8 lg:px-10">
        <Skeleton className="h-36 rounded-3xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!dashboard) {
    return (
      <main className="mx-auto flex min-h-[420px] max-w-[1440px] items-center justify-center px-5 py-6 sm:px-8 lg:px-10">
        <section className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm dark:border-rose-950/50 dark:bg-white/[.03]">
          <h1 className="text-lg font-semibold">Dashboard belum dapat dimuat</h1>
          <p className="mt-2 text-sm text-zinc-500">
            {loadError ?? "Terjadi kendala saat mengambil data dashboard."}
          </p>
          <Button className="mt-5 bg-blue-600 text-white hover:bg-blue-700" onClick={() => void load(filters)}>
            Coba lagi
          </Button>
        </section>
      </main>
    );
  }

  const { summary } = dashboard;
  const alerts = dashboard.alerts ?? [];
  const rankings = dashboard.rankings ?? [];
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
                  period: "this_month",
                  startDate: "",
                  endDate: "",
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
              <Label htmlFor="dashboard-period">Periode</Label>
              <Select
                value={filters.period}
                onValueChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    period: value ?? current.period,
                  }))
                }
              >
                <SelectTrigger
                  id="dashboard-period"
                  className="!h-9 !w-full !px-3 text-sm"
                >
                  <SelectValue>
                    {DASHBOARD_PERIOD_LABELS[filters.period] ?? "Pilih periode"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hari ini</SelectItem>
                  <SelectItem value="this_week">Minggu ini</SelectItem>
                  <SelectItem value="this_month">Bulan ini</SelectItem>
                  <SelectItem value="this_year">Tahun ini</SelectItem>
                  <SelectItem value="custom">Rentang tanggal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dashboard-start-date">Tanggal mulai</Label>
              <Input
                id="dashboard-start-date"
                type="date"
                value={filters.startDate}
                disabled={filters.period !== "custom"}
                className="!h-9 !rounded-md !px-3 text-sm"
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dashboard-end-date">Tanggal selesai</Label>
              <Input
                id="dashboard-end-date"
                type="date"
                value={filters.endDate}
                disabled={filters.period !== "custom"}
                className="!h-9 !rounded-md !px-3 text-sm"
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
              />
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
              ? index < 4 ? "xl:col-span-3" : "xl:col-span-4"
              : metricKeys.length === 6
                ? "xl:col-span-4"
                : metricKeys.length === 5
                  ? index < 3 ? "xl:col-span-4" : "xl:col-span-6"
                  : "xl:col-span-3";
            return (
              <div key={key} className={columnSpan}>
                <DashboardMetricCard metricKey={key} value={summary[key]} />
              </div>
            );
          })}
        </div>
      </section>

      {role === "Super Admin" ? (
        <SuperAdminPanels data={dashboard.data ?? {}} />
      ) : role === "Admin Institusi" ? (
        <>
          <AdminInstitusiDashboard>
            <SchoolInsightsPanel data={dashboard.data ?? {}} rankings={rankings} />
          </AdminInstitusiDashboard>
        </>
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
                title={isAdminRole ? "Distribusi ekosistem" : "Ringkasan grup belajar"}
                description={isAdminRole ? "Perbandingan metrik utama pada cakupan Anda" : "Aktivitas pada grup belajar yang Anda ampu"}
              />
            </StandardDashboard>
          )}
          <AlertsPanel role={role} alerts={alerts} />
        </section>
      )}

      {role !== "Super Admin" && !isPelajar && summary.quiz_rankings_available ? (
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
          {quickAccessModules.map(({ href, title, description, icon: Icon }) => (
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
            ))}
        </div>
      </section>
      ) : null}
    </main>
  );
}
