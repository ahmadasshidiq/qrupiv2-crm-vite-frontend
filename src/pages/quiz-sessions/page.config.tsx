import type { BackendModuleConfig } from "@/components/backend-module-page";
import { Badge } from "@/components/ui/badge";
import { ChartNoAxesCombined } from "lucide-react";

const positiveBadgeClass =
  "px-4 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900";
const negativeBadgeClass =
  "px-4 py-1 text-xs font-bold bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900";
const progressBadgeClass =
  "px-4 py-1 text-xs font-bold bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900";

function statusBadge(value: unknown) {
  const status = String(value ?? "").toLowerCase();
  const labels: Record<string, string> = {
    submitted: "Submitted",
    in_progress: "In Progress",
    timeout: "Timeout",
    failed: "Failed",
  };

  return (
    <Badge
      className={
        status === "submitted"
          ? positiveBadgeClass
          : status === "in_progress"
            ? progressBadgeClass
            : negativeBadgeClass
      }
    >
      {labels[status] ?? String(value ?? "-")}
    </Badge>
  );
}

function scoreBadge(value: unknown) {
  const score = Number(value ?? 0);
  return <Badge className={score > 0 ? positiveBadgeClass : negativeBadgeClass}>{score}</Badge>;
}
export const QUIZ_SESSIONS_PAGE_CONFIG: BackendModuleConfig = {
  title: "Riwayat Sesi & Nilai",
  behaviorKey: "Riwayat Sesi & Nilai",
  description: "Pantau pelaksanaan dan hasil sesi kuis.",
  emptyMessage: "Belum ada sesi kuis",
  headerAction: {
    label: "Ranking Siswa",
    icon: ChartNoAxesCombined,
    href: "/quiz-sessions/rankings",
  },
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
    { key: "quiz_title", title: "Kuis" },
    { key: "user_name", title: "Peserta" },
    { key: "learning_group_name", title: "Grup belajar" },
    { key: "status", title: "Status", formatter: statusBadge },
    { key: "score", title: "Nilai", formatter: scoreBadge },
    {
      key: "cheating_count",
      title: "Peringatan",
      formatter: (value) => {
        const warningCount = Number(value ?? 0);
        if (warningCount === 0) return "-";

        return <Badge className={negativeBadgeClass}>{warningCount}</Badge>;
      },
    },
  ],
};
