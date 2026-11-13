import { useRef, useState } from "react";
import { CircleHelp, FileText, Loader2, Upload, X } from "lucide-react";
import { QuizImportGuide } from "@/components/quiz-import-guide";
import { toast } from "sonner";
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
import { importQuizQuestions } from "@/lib/api/quiz-imports";
import type { QuizImportResultDto } from "@/lib/dto/quiz-import";

export type QuizImportMode = "append" | "replace";

const ACCEPTED_FORMATS =
  ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

type QuizImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: (result: QuizImportResultDto, mode: QuizImportMode) => void;
};

export function QuizImportDialog({
  open,
  onOpenChange,
  onImported,
}: QuizImportDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [defaultPoints, setDefaultPoints] = useState<number | "">(1);
  const [mode, setMode] = useState<QuizImportMode>("append");
  const [uploading, setUploading] = useState(false);
  const [guideConfirmed, setGuideConfirmed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!files.length) return;
    setUploading(true);
    try {
      const result = await importQuizQuestions(
        files,
        Number(defaultPoints) || 1,
      );
      if (!result.questions.length) {
        toast.error(result.warnings[0] ?? "Tidak ada soal yang terdeteksi.");
        return;
      }
      onImported(result, mode);
      toast.success(
        `${result.questions.length} soal berhasil diimport. Periksa kembali sebelum menyimpan.`,
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Import soal gagal.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !uploading && onOpenChange(next)}
    >
      <DialogContent className="w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] gap-6 rounded-2xl p-6 sm:!max-w-2xl sm:p-6 lg:p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Import Soal dari PDF / Scan
          </DialogTitle>
          <DialogDescription>
            Soal, tipe soal, pilihan jawaban, poin, dan gambar akan terisi
            otomatis. Jawaban hanya terisi jika tertulis di dokumen (misalnya
            "Jawaban: B" atau halaman "Kunci Jawaban").
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-slate-600 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-slate-300">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                Tips agar hasil akurat
              </p>
              <QuizImportGuide
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 bg-white dark:bg-transparent"
                  >
                    <CircleHelp className="size-4" />
                    Panduan format
                  </Button>
                }
              />
            </div>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              <li>
                Soal diawali nomor: <span className="font-mono">1.</span> dan
                pilihan: <span className="font-mono">A.</span> /{" "}
                <span className="font-mono">a.</span>
              </li>
              <li>
                Gunakan judul bagian seperti "Pilihan Ganda", "Benar atau
                Salah", "Isian", "Uraian".
              </li>
              <li>
                Foto/scan tegak lurus, terang, dan tidak buram. PDF asli (bukan
                scan) paling akurat.
              </li>
            </ul>
          </div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center gap-4 rounded-xl border-2 border-dashed border-slate-300 p-4 text-left transition hover:border-blue-500 dark:border-white/15 dark:hover:border-blue-500"
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
              <FileText className="size-6" />
            </span>
            <span>
              <span className="block font-semibold">
                {files.length
                  ? `${files.length} file dipilih`
                  : "Pilih file PDF atau foto/scan soal"}
              </span>
              <span className="text-sm text-slate-500">
                PDF, JPG, PNG · maks. 20 file, 20MB per file, 30 halaman per PDF
              </span>
            </span>
          </button>
          <input
            ref={inputRef}
            hidden
            multiple
            type="file"
            accept={ACCEPTED_FORMATS}
            onChange={(event) => {
              setFiles((current) => [
                ...current,
                ...Array.from(event.target.files ?? []),
              ]);
              event.target.value = "";
            }}
          />
          {files.length ? (
            <ul className="space-y-1.5 text-sm">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10"
                >
                  <span className="truncate">
                    {index + 1}. {file.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={uploading}
                    aria-label={`Hapus ${file.name}`}
                    onClick={() =>
                      setFiles((current) =>
                        current.filter((_, fileIndex) => fileIndex !== index),
                      )
                    }
                  >
                    <X className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="quiz-import-points">Poin default per soal</Label>
              <Input
                id="quiz-import-points"
                type="number"
                min="1"
                className="h-9"
                value={defaultPoints}
                onChange={(event) =>
                  setDefaultPoints(
                    event.target.value === "" ? "" : Number(event.target.value),
                  )
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Soal yang sudah ada</Label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["append", "Tambahkan"],
                    ["replace", "Ganti semua"],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    variant={mode === value ? "default" : "outline"}
                    className="h-9"
                    onClick={() => setMode(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-blue-600"
              checked={guideConfirmed}
              disabled={uploading}
              onChange={(event) => setGuideConfirmed(event.target.checked)}
            />
            <span>
              Saya sudah memastikan dokumen sesuai{" "}
              <span className="font-semibold">Panduan format</span> dan akan
              memeriksa ulang hasil import sebelum menyimpan.
            </span>
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t pt-5">
          <Button
            className="p-4"
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            className="bg-blue-600 p-4 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
            type="button"
            disabled={!files.length || !guideConfirmed || uploading}
            onClick={() => void submit()}
          >
            {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
            {uploading ? "Membaca dokumen..." : "Import Soal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
