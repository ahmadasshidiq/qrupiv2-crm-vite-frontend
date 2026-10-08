import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChartNoAxesCombined,
  FileDown,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResourceAutocomplete } from "@/components/resource-autocomplete";
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
import { fetchQuizRankings, type QuizRankingFilters } from "./actions";
import type { QuizRankingItemDto } from "@/lib/dto/quiz-ranking";

export default function QuizRankingPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<QuizRankingItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftFilters, setDraftFilters] = useState<QuizRankingFilters>({
    scope: "school",
    limit: 50,
  });
  const [appliedFilters, setAppliedFilters] = useState<QuizRankingFilters>({
    scope: "school",
    limit: 50,
  });
  const load = useCallback(() => {
    setLoading(true);
    void fetchQuizRankings(appliedFilters)
      .then((response) => setItems(response.rankings ?? response.data ?? []))
      .catch((error) =>
        toast.error(
          error instanceof ApiError
            ? error.message
            : "Ranking kuis gagal dimuat.",
        ),
      )
      .finally(() => setLoading(false));
  }, [appliedFilters]);
  useEffect(() => {
    const task = window.setTimeout(load, 0);
    return () => window.clearTimeout(task);
  }, [load]);
  const ranking = useMemo(
    () =>
      items
        .slice()
        .sort(
          (a, b) =>
            (b.average_score ?? b.score ?? b.total_score ?? 0) -
            (a.average_score ?? a.score ?? a.total_score ?? 0),
        ),
    [items],
  );
  const maximum = Math.max(
    1,
    ...ranking.map(
      (item) => item.average_score ?? item.score ?? item.total_score ?? 0,
    ),
  );
  const scopeLabels: Record<QuizRankingFilters["scope"], string> = {
    school: "Sekolah",
    class: "Kelas",
  };
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
    const rows = ranking
      .map((item, index) => {
        const score = item.average_score ?? item.score ?? item.total_score ?? 0;
        return `<tr><td>${index + 1}</td><td>${escapeHtml(item.user_name ?? item.name ?? "Siswa")}</td><td>${score}</td><td>${item.quiz_count ?? item.completed_quizzes ?? 0}</td></tr>`;
      })
      .join("");
    report.document.write(
      `<!doctype html><html><head><title>Ranking Siswa</title><style>body{font-family:Arial,sans-serif;color:#111827;padding:32px}h1{margin:0 0 4px;font-size:24px}p{color:#6b7280;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:24px;font-size:13px}th,td{text-align:left;border-bottom:1px solid #e5e7eb;padding:10px}th{color:#6b7280}@media print{body{padding:0}}</style></head><body><h1>Ranking Siswa</h1><p>Scope: ${escapeHtml(scopeLabels[appliedFilters.scope])} · Periode: ${escapeHtml(appliedFilters.start_date || "Semua tanggal")} sampai ${escapeHtml(appliedFilters.end_date || "Semua tanggal")}</p><table><thead><tr><th>Peringkat</th><th>Nama siswa</th><th>Nilai</th><th>Sesi selesai</th></tr></thead><tbody>${rows}</tbody></table></body></html>`,
    );
    report.document.close();
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
        className="-ml-2 mb-2"
        onClick={() => navigate("/quiz-sessions")}
      >
        <ArrowLeft className="size-4" /> Kembali ke riwayat sesi
      </Button>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Ranking Siswa</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Pantau peringkat nilai siswa berdasarkan sesi kuis yang telah
            selesai.
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
              const empty = { scope: "school" as const, limit: 50 };
              setDraftFilters(empty);
              setAppliedFilters(empty);
            }}
          >
            <RotateCcw className="size-4" /> Reset Filter
          </Button>
        </div>
        <div className={`grid gap-3 sm:grid-cols-2 ${draftFilters.scope === "class" ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
          <div className="grid gap-1.5">
            <Label>Scope ranking</Label>
            <Select
              value={scopeLabels[draftFilters.scope]}
              onValueChange={(label) => {
                const scope = (Object.entries(scopeLabels).find(
                  ([, value]) => value === label,
                )?.[0] ?? "school") as QuizRankingFilters["scope"];
                setDraftFilters((current) => ({
                  ...current,
                  scope,
                  learning_group_id:
                    scope === "school" ? undefined : current.learning_group_id,
                }));
              }}
            >
              <SelectTrigger className="!h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sekolah">Sekolah</SelectItem>
                <SelectItem value="Kelas">Kelas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {draftFilters.scope === "class" && (
            <div className="grid gap-1.5">
              <Label>Grup pembelajaran</Label>
              <ResourceAutocomplete
                name="learning_group_id"
                value={draftFilters.learning_group_id ?? ""}
                endpoint="/learning-groups"
                placeholder="Cari grup pembelajaran"
                onValueChange={(value) =>
                  setDraftFilters((current) => ({
                    ...current,
                    learning_group_id: value,
                  }))
                }
              />
            </div>
          )}
          <div className="grid gap-1.5">
            <Label>Kuis</Label>
            <ResourceAutocomplete
              name="quiz_id"
              value={draftFilters.quiz_id ?? ""}
              endpoint="/quizzes"
              placeholder="Cari kuis"
              onValueChange={(value) =>
                setDraftFilters((current) => ({ ...current, quiz_id: value }))
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Tanggal mulai</Label>
            <Input
              className="!h-9"
              type="date"
              value={draftFilters.start_date ?? ""}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  start_date: event.target.value,
                }))
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Tanggal akhir</Label>
            <Input
              className="!h-9"
              type="date"
              value={draftFilters.end_date ?? ""}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  end_date: event.target.value,
                }))
              }
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
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
            disabled={loading}
          >
            <FileDown className="size-4" /> Export PDF
          </Button>
        </div>
      </section>
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-center gap-2">
          <ChartNoAxesCombined className="size-5 text-blue-600" />
          <h3 className="text-sm font-semibold">Grafik Ranking Nilai</h3>
        </div>
        {loading ? (
          <div className="mt-8 h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-white/10" />
        ) : ranking.length ? (
          <div className="mt-6 space-y-4">
            {ranking.map((item, index) => {
              const score =
                item.average_score ?? item.score ?? item.total_score ?? 0;
              return (
                <div key={item.user_id ?? item.user_name ?? item.name ?? index}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="truncate font-medium">
                      {index + 1}. {item.user_name ?? item.name ?? "Siswa"}
                    </span>
                    <span className="font-semibold text-blue-600">{score}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${(score / maximum) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {item.quiz_count ?? item.completed_quizzes ?? 0} sesi
                    selesai
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
            Belum ada data ranking sesuai filter.
          </div>
        )}
      </section>
    </main>
  );
}
