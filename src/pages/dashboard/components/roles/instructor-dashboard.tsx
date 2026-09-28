import { Activity, AlertTriangle, CalendarCheck, GraduationCap, Layers3, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, ChartContainer, ChartTooltip, ChartTooltipContent, XAxis, YAxis } from "@/components/ui/chart";

type Row = Record<string, unknown>;

const number = (value: unknown) => Number(value ?? 0);
const text = (value: unknown, fallback: string) => String(value ?? fallback);
const list = (value: unknown): Row[] => Array.isArray(value) ? value.filter((item): item is Row => Boolean(item && typeof item === "object")) : [];

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-white/10 dark:bg-white/[.03]"><h2 className="font-semibold">{title}</h2>{description ? <p className="mt-1 text-xs text-zinc-500">{description}</p> : null}{children}</section>;
}

function Empty({ children = "Data belum tersedia." }: { children?: string }) {
  return <div className="mt-4 rounded-xl border border-dashed border-zinc-200 p-5 text-center text-xs text-zinc-500 dark:border-white/10">{children}</div>;
}

export function InstructorDashboard({ summary, data }: { summary: Row; data: Row }) {
  const groups = list(data.learning_groups ?? data.groups);
  const attention = list(data.students_need_attention ?? data.students_attention);
  const positive = number(summary.positive_activities ?? data.positive_activities);
  const violations = number(summary.violation_activities ?? data.violation_activities);
  const cards = [
    ["Total grup yang diajar", summary.total_learning_groups, Layers3, "text-blue-600"],
    ["Total siswa", summary.total_students ?? summary.total_learning_group_members, GraduationCap, "text-violet-600"],
    ["Total aktivitas siswa", summary.total_activities, Activity, "text-cyan-600"],
    ["Aktivitas positif", positive, Trophy, "text-emerald-600"],
    ["Jumlah pelanggaran", violations, AlertTriangle, "text-rose-600"],
    ["Total presensi", summary.total_attendance_logs, CalendarCheck, "text-amber-600"],
    ["Total sesi kuis", summary.total_quiz_sessions, Trophy, "text-indigo-600"],
    ["Rata-rata nilai kuis", summary.average_quiz_score ?? summary.avg_quiz_score, Trophy, "text-fuchsia-600"],
  ] as const;
  const trend = list(data.activity_trend ?? data.activity_chart ?? data.daily_trend).slice(-14).map((item) => ({
    date: text(item.date ?? item.label, "-"), positive: number(item.positive_activities ?? item.positive), violation: number(item.violation_activities ?? item.violations ?? item.violation),
  }));

  return <section className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(([label, value, Icon, color]) => <div key={label} className="rounded-2xl border border-zinc-200/80 bg-white px-5 py-4 shadow-sm dark:border-white/10 dark:bg-white/[.03]"><Icon className={`size-5 ${color}`} /><p className="mt-3 text-2xl font-bold">{number(value).toLocaleString("id-ID", { maximumFractionDigits: 1 })}</p><p className="text-xs text-zinc-500">{label}</p></div>)}
    </div>

    <Panel title="Daftar grup belajar" description="Ringkasan performa grup yang Anda ampu.">
      {groups.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b text-xs text-zinc-500"><tr><th className="pb-3">Grup</th><th className="pb-3">Siswa</th><th className="pb-3">Aktivitas</th><th className="pb-3">Kehadiran</th><th className="pb-3">Nilai kuis</th><th className="pb-3">Pelanggaran</th></tr></thead><tbody>{groups.map((group, index) => <tr key={text(group.id, String(index))} className="border-b last:border-0"><td className="py-3 font-medium">{text(group.name ?? group.title, "Grup belajar")}</td><td>{number(group.student_count ?? group.total_students)}</td><td>{number(group.activity_count ?? group.total_activities)}</td><td>{number(group.attendance_percentage ?? group.attendance_rate)}%</td><td>{number(group.average_quiz_score ?? group.avg_quiz_score).toFixed(1)}</td><td>{number(group.violation_count ?? group.violations)}</td></tr>)}</tbody></table></div> : <Empty>Data grup belajar belum tersedia.</Empty>}
    </Panel>

    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Tren aktivitas positif dan pelanggaran" description="Perubahan aktivitas dalam periode terpilih.">{trend.length ? <div className="mt-5 h-64"><ChartContainer><BarChart data={trend}><CartesianGrid vertical={false} strokeDasharray="3 3" /><XAxis dataKey="date" tickLine={false} axisLine={false} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="positive" name="Positif" fill="#10b981" radius={[4, 4, 0, 0]} /><Bar dataKey="violation" name="Pelanggaran" fill="#f43f5e" radius={[4, 4, 0, 0]} /></BarChart></ChartContainer></div> : <Empty>Tren aktivitas belum tersedia dari backend.</Empty>}</Panel>
      <Panel title="Siswa yang perlu perhatian" description="Prioritas monitoring siswa pada periode terpilih.">{attention.length ? <div className="mt-4 space-y-2">{attention.slice(0, 8).map((student, index) => <div key={text(student.id, String(index))} className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 text-sm dark:bg-white/5"><span className="font-medium">{text(student.name ?? student.student_name, "Siswa")}</span><span className="text-xs text-rose-600">{text(student.reason ?? student.issue ?? "Perlu perhatian", "Perlu perhatian")}</span></div>)}</div> : <Empty>Tidak ada siswa yang perlu perhatian.</Empty>}</Panel>
    </div>
  </section>;
}
