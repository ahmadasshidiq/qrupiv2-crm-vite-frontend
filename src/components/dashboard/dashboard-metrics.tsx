import {
  Activity,
  BookOpen,
  Building2,
  CalendarCheck,
  GraduationCap,
  Layers3,
  Users,
  type LucideIcon,
} from "lucide-react";

export type DashboardMetricKey =
  | "total_users"
  | "total_institutions"
  | "total_learning_groups"
  | "total_learning_group_members"
  | "total_activities"
  | "total_quiz_sessions"
  | "total_attendance_logs";

export type DashboardMetricSummary = Record<DashboardMetricKey, number>;

const fmt = new Intl.NumberFormat("id-ID");

const METRIC_META: Record<DashboardMetricKey, { label: string; icon: LucideIcon }> = {
  total_institutions: { label: "Institusi", icon: Building2 },
  total_users: { label: "Pengguna", icon: Users },
  total_learning_groups: { label: "Grup Pembelajaran", icon: Layers3 },
  total_learning_group_members: { label: "Anggota kelompok", icon: GraduationCap },
  total_activities: { label: "Aktivitas", icon: Activity },
  total_quiz_sessions: { label: "Sesi kuis", icon: BookOpen },
  total_attendance_logs: { label: "Log kehadiran", icon: CalendarCheck },
};

export function DashboardMetricCard({
  metricKey,
  value,
}: {
  metricKey: DashboardMetricKey;
  value: number;
}) {
  const { label, icon: Icon } = METRIC_META[metricKey];
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white px-5 py-4 shadow-sm dark:border-white/10 dark:bg-white/[.03]">
      <div className="flex items-center justify-between">
        <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
          <Icon className="size-[17px]" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Total</span>
      </div>
      <p className="mt-3 text-2xl font-bold">{fmt.format(value)}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

