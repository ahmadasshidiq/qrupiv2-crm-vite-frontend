import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, LoaderCircle } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchPaginated } from "@/lib/api/paginated";
import type { ApiRecordDto } from "@/lib/dto/api";
import type { QuizReportMemberDto } from "@/lib/dto/quiz-report";
import { QUIZ_GRADE_COMPONENTS, type QuizGradeWeights } from "@/lib/helper/quiz-grade";
import { openPrintReport } from "@/lib/report/print-report";
import { fetchLearningGroupStudents, fetchQuizReportSource } from "../actions";
import { buildQuizResults, buildStudentTranscripts } from "../report-data";
import { loadQuizReportWeights, saveQuizReportWeights } from "../report-weights";
import {
  QUIZ_REPORT_STYLES,
  renderQuizResults,
  renderRecap,
  renderTranscripts,
} from "../templates/quiz-report-template";
import type { QuizReportMode } from "../types";

const ALL = "__all__";
const triggerClass = "!h-10 !w-full !bg-white !px-3 font-normal dark:!bg-white/[0.03]";

const REPORT_MODES: Array<{ value: QuizReportMode; label: string; title: string }> = [
  { value: "recap", label: "Rekap nilai semua siswa", title: "Rekap Nilai Siswa" },
  { value: "transcript", label: "Transkrip nilai per siswa", title: "Transkrip Nilai Siswa" },
  { value: "quiz-result", label: "Hasil per kuis", title: "Laporan Hasil Kuis" },
];

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export function QuizReportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [mode, setMode] = useState<QuizReportMode>("recap");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [groupId, setGroupId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [groups, setGroups] = useState<ApiRecordDto[]>([]);
  const [students, setStudents] = useState<QuizReportMemberDto[]>([]);
  const [weights, setWeights] = useState<QuizGradeWeights>(loadQuizReportWeights);
  const [loading, setLoading] = useState(false);

  const totalWeight = QUIZ_GRADE_COMPONENTS.reduce((total, { key }) => total + weights[key], 0);
  const usesWeights = mode !== "quiz-result";
  const groupName = String(groups.find((group) => String(group.id) === groupId)?.name ?? "Semua Grup Belajar");
  const studentName = students.find((student) => student.user_id === studentId)?.user_name ?? "Semua siswa";

  useEffect(() => {
    if (!open) return;
    void fetchPaginated("/learning-groups", 1, 5000)
      .then((result) => setGroups(result.items))
      .catch(() => setGroups([]));
  }, [open]);

  useEffect(() => {
    if (!groupId) return;
    void fetchLearningGroupStudents(groupId)
      .then((result) => setStudents(result.items))
      .catch(() => setStudents([]));
  }, [groupId]);

  function selectGroup(value: string | null) {
    setGroupId(!value || value === ALL ? "" : value);
    setStudentId("");
    setStudents([]);
  }

  async function printReport() {
    if (!from || !to) return toast.error("Pilih bulan mulai dan bulan akhir.");
    if (usesWeights && totalWeight <= 0) return toast.error("Total bobot harus lebih dari 0.");
    setLoading(true);
    try {
      const source = await fetchQuizReportSource({
        from,
        to,
        learningGroupId: groupId || undefined,
        studentId: mode === "transcript" ? studentId || undefined : undefined,
      });
      const transcripts = buildStudentTranscripts(source, weights);
      const content =
        mode === "recap"
          ? renderRecap(transcripts, weights)
          : mode === "transcript"
            ? renderTranscripts(transcripts, weights)
            : renderQuizResults(buildQuizResults(source, transcripts));
      const opened = openPrintReport({
        title: REPORT_MODES.find((item) => item.value === mode)?.title ?? "Laporan Nilai",
        period: `${formatMonthLabel(from)} - ${formatMonthLabel(to)}`,
        content,
        extraStyles: QUIZ_REPORT_STYLES,
      });
      if (!opened) return toast.error("Izinkan pop-up browser untuk mencetak report.");
      if (usesWeights) saveQuizReportWeights(weights);
      onOpenChange(false);
    } catch {
      toast.error("Report nilai gagal dibuat.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-xl gap-6 rounded-2xl p-5 sm:max-w-xl">
        <DialogHeader className="gap-1">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <FileText className="size-5" />
            Report Nilai PDF
          </DialogTitle>
          <DialogDescription>
            Pilih jenis laporan, periode, dan bobot nilai untuk membuat transkrip atau rekap nilai kuis.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label>Jenis laporan</Label>
            <Select value={mode} onValueChange={(value) => value && setMode(value as QuizReportMode)}>
              <SelectTrigger className={triggerClass}>
                <SelectValue>{REPORT_MODES.find((item) => item.value === mode)?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {REPORT_MODES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={`grid gap-1.5 ${mode === "transcript" ? "" : "sm:col-span-2"}`}>
            <Label>Grup belajar</Label>
            <Select value={groupId || ALL} onValueChange={selectGroup}>
              <SelectTrigger className={triggerClass}>
                <SelectValue>{groupName}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua Grup Belajar</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={String(group.id)} value={String(group.id)}>
                    {String(group.name ?? "Grup belajar")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {mode === "transcript" ? (
            <div className="grid gap-1.5">
              <Label>Siswa</Label>
              <Select
                value={studentId || ALL}
                disabled={!groupId}
                onValueChange={(value) => setStudentId(!value || value === ALL ? "" : value)}
              >
                <SelectTrigger className={triggerClass}>
                  <SelectValue>{groupId ? studentName : "Pilih grup dulu"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Semua siswa</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.user_id} value={student.user_id}>
                      {student.user_name ?? "-"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="grid gap-1.5">
            <Label htmlFor="quiz-report-from">Bulan mulai</Label>
            <Input
              id="quiz-report-from"
              className="!h-10 !rounded-lg !px-3"
              type="month"
              value={from}
              max={to || undefined}
              onChange={(event) => {
                setFrom(event.target.value);
                if (to && event.target.value > to) setTo(event.target.value);
              }}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="quiz-report-to">Bulan akhir</Label>
            <Input
              id="quiz-report-to"
              className="!h-10 !rounded-lg !px-3"
              type="month"
              value={to}
              min={from || undefined}
              onChange={(event) => {
                setTo(event.target.value);
                if (from && event.target.value < from) setFrom(event.target.value);
              }}
            />
          </div>
          {usesWeights ? (
            <div className="grid gap-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Bobot nilai akhir</Label>
                <span className={`text-xs ${totalWeight === 100 ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400"}`}>
                  Total {totalWeight}
                  {totalWeight !== 100 && totalWeight > 0 ? " (akan dihitung proporsional)" : ""}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {QUIZ_GRADE_COMPONENTS.map(({ key, label }) => (
                  <div key={key} className="grid gap-1">
                    <Label htmlFor={`quiz-weight-${key}`} className="text-xs text-muted-foreground">{label}</Label>
                    <Input
                      id={`quiz-weight-${key}`}
                      className="!h-10 !rounded-lg !px-3"
                      type="number"
                      min={0}
                      max={100}
                      value={weights[key]}
                      onChange={(event) =>
                        setWeights((current) => ({ ...current, [key]: Math.max(Number(event.target.value) || 0, 0) }))
                      }
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Bobot tersimpan untuk akun Anda. Kuis yang tidak dikerjakan bernilai 0 dan ikut menurunkan rata-rata.
              </p>
            </div>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" className="p-4" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            className="p-4 bg-blue-600 text-white hover:bg-blue-700"
            disabled={loading}
            onClick={() => void printReport()}
          >
            {loading ? <LoaderCircle className="animate-spin" /> : <FileText />} Buat PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
