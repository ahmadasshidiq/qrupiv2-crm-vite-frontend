import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/api/client";
import { getCsrfToken } from "@/lib/auth/session";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1"
).replace(/\/$/, "");

type ImportJob = {
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  total_data?: number;
  processed_data?: number;
  failed_data?: number;
  errors?: string[] | string;
  error_message?: string;
};

type ImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onCompleted?: () => void;
};

function parseImportErrors(errors: ImportJob["errors"]): string[] {
  if (Array.isArray(errors)) return errors;
  if (!errors) return [];

  try {
    const parsed = JSON.parse(atob(errors)) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [errors];
  } catch {
    return [errors];
  }
}

export function ImportDialog({
  open,
  onOpenChange,
  title,
  description,
  onCompleted,
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [job, setJob] = useState<ImportJob | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setJob(null);
      setUploading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed") return;
    const timer = window.setTimeout(async () => {
      try {
        const nextJob = await apiRequest<ImportJob>(
          `/users/import-excel/${job.job_id}`,
        );
        setJob(nextJob);
      } catch (error) {
        setJob((current) =>
          current
            ? {
                ...current,
                status: "failed",
                error_message:
                  error instanceof Error
                    ? error.message
                    : "Status import gagal.",
              }
            : current,
        );
      }
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [job]);

  useEffect(() => {
    if (!job) return;
    if (job.status === "completed") {
      toast.success("Import data berhasil diproses.");
      onCompleted?.();
    }
    if (job.status === "failed")
      toast.error(job.error_message ?? "Import data gagal diproses.");
  }, [job, onCompleted]);

  const submit = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiRequest<ImportJob>("/users/import-excel", {
        method: "POST",
        body: formData,
      });
      setJob(response);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Upload file gagal.",
      );
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/template-excel`, {
        credentials: "include",
        headers: { "X-CSRF-Token": getCsrfToken() ?? "" },
      });
      if (!response.ok) throw new Error("Template Excel gagal diunduh.");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "users_template.xlsx";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Template Excel gagal diunduh.",
      );
    }
  };

  const progress = job?.total_data
    ? Math.round(((job.processed_data ?? 0) / job.total_data) * 100)
    : 0;
  const isRunning =
    uploading || job?.status === "pending" || job?.status === "processing";
  const importErrors = parseImportErrors(job?.errors);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] gap-6 rounded-2xl p-6 sm:!max-w-2xl sm:p-8 lg:p-10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            Import Data {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-200">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 size-5 shrink-0" />
              <p>
                Gunakan file Excel dengan format kolom yang sesuai. Kolom
                bertanda <span className="font-semibold text-red-500">*</span>{" "}
                wajib diisi.
              </p>
            </div>
          </div> */}
          <div className="flex flex-col justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/20 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold">Template Import</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Sheet Users berisi kolom siswa, guru, dan admin.
              </p>
            </div>
            <Button
              className="p-4"
              type="button"
              variant="outline"
              onClick={() => void downloadTemplate()}
            >
              <Download /> Download Template
            </Button>
          </div>
          <button
            type="button"
            disabled={Boolean(isRunning)}
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center gap-4 rounded-xl border-2 border-dashed border-slate-300 p-4 text-left transition hover:border-blue-500 dark:border-white/15 dark:hover:border-blue-500"
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
              <FileSpreadsheet className="size-6" />
            </span>
            <span>
              <span className="block font-semibold">
                {file?.name ?? "Pilih file Excel untuk diimport"}
              </span>
              <span className="text-sm text-slate-500">
                Format yang didukung: .xlsx dan .xls
              </span>
            </span>
          </button>
          <input
            ref={inputRef}
            hidden
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          {job ? (
            <div className="rounded-xl border p-4 text-sm">
              <div className="flex items-center gap-2 font-medium">
                {job.status === "completed" ? (
                  <CheckCircle2 className="size-5 text-emerald-600" />
                ) : (
                  <Loader2 className="size-5 animate-spin text-blue-600" />
                )}{" "}
                Status: {job.status}
              </div>
              {job.total_data ? (
                <>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-slate-500">
                    {job.processed_data ?? 0} dari {job.total_data} data
                    diproses · {job.failed_data ?? 0} gagal
                  </p>
                </>
              ) : null}
              {importErrors.length ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-red-600">
                  {importErrors.slice(0, 5).map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t pt-5">
          <Button
            className="p-4"
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            className="p-4 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
            type="button"
            disabled={!file || Boolean(isRunning)}
            onClick={() => void submit()}
          >
            <Upload />{" "}
            {uploading
              ? "Mengupload..."
              : isRunning
                ? "Memproses..."
                : "Import"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
