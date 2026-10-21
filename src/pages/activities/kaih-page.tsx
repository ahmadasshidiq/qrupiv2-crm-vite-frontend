import { useCallback, useEffect, useState } from "react";
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
import { fetchKaihDashboard } from "./kaih-actions";
import {
  KAIH_CATEGORIES,
  type KaihDashboardResponseDto,
} from "@/lib/dto/kaih-dashboard";
import { buildAttendanceReportTemplate } from "@/pages/attendances/templates/attendance-report-template";
import qrupiLogo from "@/assets/qrupi-logo.png";
import { getAuthUser } from "@/lib/auth/session";

function dateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}
function defaultFilters() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return {
    start_date: dateValue(start),
    end_date: dateValue(end),
    learning_group_id: "",
  };
}
type KaihFilters = {
  start_date: string;
  end_date: string;
  learning_group_id: string | null;
};

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ] ?? character,
  );
}

function formatReportDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function exportKaihPdf(
  data: KaihDashboardResponseDto | null,
  filters: KaihFilters,
  groups: Array<{ id?: string; name?: string }>,
) {
  const reportData = data ?? {
    start_date: filters.start_date,
    end_date: filters.end_date,
    jumlah_hari: 0,
    minimum_per_kategori: 0,
    students: [],
  };
  const groupName =
    groups.find(
      (group) => String(group.id) === String(filters.learning_group_id),
    )?.name ?? "Semua grup";
  const user = getAuthUser();
  const institution = user?.institution as
    | {
        name?: string;
        address?: string;
        phone?: string;
        website?: string;
        file_url?: string;
        avatar_url?: string;
      }
    | null
    | undefined;
  const rows = reportData.students
    .map(
      (student) =>
        `<tr><td>${student.no}</td><td>${escapeHtml(student.nama)}</td>${KAIH_CATEGORIES.map(
          (category) => {
            const value = student.kategori?.[category] ?? 0;
            return `<td style="font-weight:700;color:${value >= reportData.minimum_per_kategori ? "#15803d" : "#dc2626"}">${value}</td>`;
          },
        ).join(
          "",
        )}<td>${student.rata_rata_nilai}</td><td style="font-weight:700;color:${student.predikat === "Terbiasa" ? "#15803d" : "#dc2626"}">${escapeHtml(student.predikat)}</td></tr>`,
    )
    .join("");
  const content = `<h2 style="margin:24px 0 8px;font-size:18px;color:#1d4ed8">Ringkasan 7 KAIH</h2><p><strong>Grup belajar:</strong> ${escapeHtml(groupName)} · <strong>Minimum per kategori:</strong> ${reportData.minimum_per_kategori}</p><table class="student-summary"><thead><tr><th>No</th><th>Nama Siswa</th>${KAIH_CATEGORIES.map((category) => `<th>${escapeHtml(category)}</th>`).join("")}<th>Rata-rata</th><th>Predikat</th></tr></thead><tbody>${rows || `<tr><td colspan="12">Belum ada data pada periode ini.</td></tr>`}</tbody></table>`;
  const report = window.open("", "_blank", "width=1200,height=800");
  if (!report)
    return toast.error("Izinkan pop-up browser untuk mencetak report.");
  report.document.write(
    buildAttendanceReportTemplate({
      title: "Laporan 7 KAIH Siswa",
      institutionName: String(institution?.name ?? "JAXER"),
      institutionAddress: String(institution?.address ?? ""),
      institutionPhone: String(institution?.phone ?? ""),
      institutionWebsite: String(institution?.website ?? ""),
      schoolLogo: String(
        institution?.file_url ?? institution?.avatar_url ?? "",
      ),
      qrupiLogo,
      period: `${formatReportDate(filters.start_date)} - ${formatReportDate(filters.end_date)}`,
      content,
      generatedAt: new Date().toLocaleString("id-ID"),
    }),
  );
  report.document.close();
  report.focus();
  window.setTimeout(() => report.print(), 300);
}

export default function KaihPage() {
  const navigate = useNavigate();
  const [draftFilters, setDraftFilters] = useState<KaihFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<KaihFilters>(defaultFilters);
  const [groups, setGroups] = useState<Array<{ id?: string; name?: string }>>(
    [],
  );
  const [data, setData] = useState<KaihDashboardResponseDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchLearningGroups(1, 500, { "lg.status": "active" })
      .then((r) => setGroups(r.items))
      .catch(() => toast.error("Grup belajar gagal dimuat."));
  }, []);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchKaihDashboard(appliedFilters));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Report 7 KAIH gagal dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);
  useEffect(() => {
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, [load]);
  const minimum = data?.minimum_per_kategori ?? 0;
  const selectedGroup = groups.find(
    (group) => String(group.id) === String(draftFilters.learning_group_id),
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-2"
            onClick={() => navigate("/activities")}
          >
            <ArrowLeft className="size-4" /> Kembali ke daftar
          </Button>
          <h1 className="text-xl font-bold tracking-tight">Report 7 KAIH</h1>
          <p className="mt-1 text-xs text-zinc-500">
            Laporan kebiasaan siswa berdasarkan periode dan grup belajar.
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Minimum per kategori:{" "}
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              {minimum || "-"}
            </span>
          </p>
        </div>
      </div>
      <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Filter Report 7 KAIH</h3>
          <Button
            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const reset = defaultFilters();
              setDraftFilters(reset);
              setAppliedFilters(reset);
            }}
          >
            <RotateCcw className="size-4" /> Reset Filter
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="grid gap-1.5">
            <Label htmlFor="kaih-start">Tanggal mulai</Label>
            <Input
              id="kaih-start"
              className="!h-9"
              type="date"
              value={draftFilters.start_date}
              onChange={(e) =>
                setDraftFilters((current) => ({
                  ...current,
                  start_date: e.target.value,
                }))
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="kaih-end">Tanggal akhir</Label>
            <Input
              id="kaih-end"
              className="!h-9"
              type="date"
              value={draftFilters.end_date}
              onChange={(e) =>
                setDraftFilters((current) => ({
                  ...current,
                  end_date: e.target.value,
                }))
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Grup belajar</Label>
            <Select
              value={selectedGroup ? String(selectedGroup.name) : "Semua grup"}
              onValueChange={(value) =>
                setDraftFilters((current) => ({
                  ...current,
                  learning_group_id:
                    groups.find((group) => String(group.name) === value)?.id ??
                    "",
                }))
              }
            >
              <SelectTrigger className="!h-9 w-full">
                <SelectValue placeholder="Semua grup" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua grup">Semua grup</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={String(group.name)}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <div className="flex gap-2">
            <Button
              className="bg-blue-600 p-4 text-white hover:bg-blue-700"
              onClick={() => setAppliedFilters(draftFilters)}
            >
              Terapkan Filter
            </Button>
            <Button
              variant="outline"
              className="gap-2 bg-amber-500 p-4 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
              onClick={() => exportKaihPdf(data, appliedFilters, groups)}
            >
              <Printer className="size-4" /> Export PDF
            </Button>
          </div>
        </div>
      </section>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[1450px] whitespace-nowrap text-left text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-3">No</th>
              <th className="p-3">Nama siswa</th>
              {KAIH_CATEGORIES.map((category) => (
                <th className="p-3" key={category}>
                  {category}
                </th>
              ))}
              <th className="p-3">Rata-rata</th>
              <th className="sticky right-0 z-20 min-w-[150px] bg-muted p-3 shadow-[-6px_0_10px_-8px_rgba(0,0,0,0.35)]">
                Predikat
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-6 text-center" colSpan={12}>
                  Memuat report...
                </td>
              </tr>
            ) : data?.students.length ? (
              data.students.map((student) => (
                <tr className="border-b last:border-0" key={student.user_id}>
                  <td className="p-3">{student.no}</td>
                  <td className="p-3 font-medium">{student.nama}</td>
                  {KAIH_CATEGORIES.map((category) => {
                    const value = student.kategori?.[category] ?? 0;
                    return (
                      <td
                        className={`p-3 font-semibold ${value >= minimum ? "text-emerald-600" : "text-red-600"}`}
                        key={category}
                      >
                        {value}
                      </td>
                    );
                  })}
                  <td className="p-3">{student.rata_rata_nilai}</td>
                  <td
                    className={`sticky right-0 z-10 min-w-[150px] bg-card p-3 font-bold shadow-[-6px_0_10px_-8px_rgba(0,0,0,0.2)] ${student.predikat === "Terbiasa" ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {student.predikat}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="p-6 text-center text-muted-foreground"
                  colSpan={12}
                >
                  Belum ada data pada periode ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
