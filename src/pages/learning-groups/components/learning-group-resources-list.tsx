import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CirclePlus,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Link2,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TableCell, TableRow } from "@/components/ui/table";
import { LearningGroupDetailTable } from "./learning-group-detail-table";
import { ApiError } from "@/lib/api/client";
import type { ApiRecordDto } from "@/lib/dto/api";
import { fetchLearningResources } from "@/pages/learning-resources/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const typeLabels: Record<string, string> = {
  file: "File",
  video: "Video",
  link: "Tautan",
};

const typeStyles: Record<string, string> = {
  file: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-900",
  video:
    "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-900",
  link: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900",
};

const typeActionStyles: Record<string, string> = {
  file: "bg-blue-800 hover:bg-blue-900",
  video: "bg-violet-700 hover:bg-violet-800",
  link: "bg-emerald-700 hover:bg-emerald-800",
};

export function LearningGroupResourcesList({ groupId }: { groupId: string }) {
  const navigate = useNavigate();
  const [resources, setResources] = useState<ApiRecordDto[]>([]);
  const [selectedResource, setSelectedResource] = useState<ApiRecordDto | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    let active = true;

    void fetchLearningResources(1, 12, {
      "lrg.learning_group_id": groupId,
    })
      .then((result) => {
        if (active) setResources(result.items);
      })
      .catch((error) => {
        if (!active) return;
        toast.error(
          error instanceof ApiError
            ? error.message
            : "Materi belajar gagal dimuat.",
        );
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [groupId]);

  return (
    <section className="border-t border-slate-100 pt-6 dark:border-white/10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
            <BookOpen className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Materi Belajar</h3>
            <p className="text-xs text-zinc-500">
              {loading
                ? "Memuat materi..."
                : `${resources.length} materi tersedia`}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-blue-500 p-4 text-white hover:bg-blue-600"
          onClick={() =>
            navigate(`/learning-resources/create?learning_group_id=${groupId}`)
          }
        >
          <CirclePlus /> Tambah Materi
        </Button>
      </div>

      {loading ? (
        <div className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-white/10" />
      ) : resources.length === 0 ? (
        <div className="rounded-xl border border-slate-200 px-4 py-6 text-center text-sm text-zinc-500 dark:border-white/10">
          Belum ada materi belajar untuk grup ini.
        </div>
      ) : (
        <LearningGroupDetailTable
          headers={["Judul", "Deskripsi", "Tipe", "Aksi"]}
          rightAlignedLastColumn
        >
          {resources.map((resource) => {
            const type = String(resource.type ?? "");
            const fileUrl = String(resource.file_url ?? "");
            return (
              <TableRow key={String(resource.id)}>
                <TableCell className="px-4 py-3 font-medium">
                  <span
                    className="block max-w-48 truncate"
                    title={String(resource.title ?? "-")}
                  >
                    {String(resource.title ?? "-")}
                  </span>
                </TableCell>
                <TableCell className="max-w-64 px-4 py-3 text-zinc-500">
                  <span
                    className="block max-w-64 truncate"
                    title={String(resource.description ?? "-")}
                  >
                    {String(resource.description ?? "-")}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge
                    className={`${typeStyles[type] ?? "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/10"}`}
                  >
                    {typeLabels[type] ?? "Lainnya"}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-2 text-right align-middle">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Lihat deskripsi materi"
                      onClick={() => setSelectedResource(resource)}
                    >
                      <Eye className="size-3.5" />
                    </Button>
                    {fileUrl ? (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Buka materi"
                        className="inline-flex size-7 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </LearningGroupDetailTable>
      )}
      <Dialog
        open={Boolean(selectedResource)}
        onOpenChange={(open) => !open && setSelectedResource(null)}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-2xl gap-0 rounded-3xl border-0 bg-white p-6 text-slate-700 shadow-xl sm:max-w-2xl sm:p-8">
          <div className="flex items-start justify-between gap-5 pr-7">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-700">
                {String(selectedResource?.title ?? "Detail Materi")}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Upload {String(selectedResource?.created_at ?? "-")} •{" "}
                {String(selectedResource?.uploaded_user_name ?? "-")}
              </p>
            </div>
            {selectedResource?.type === "video" ? (
              <Video
                className="size-7 shrink-0 text-slate-900"
                strokeWidth={1.6}
              />
            ) : selectedResource?.type === "link" ? (
              <Link2
                className="size-7 shrink-0 text-slate-900"
                strokeWidth={1.6}
              />
            ) : (
              <FileText
                className="size-7 shrink-0 text-slate-900"
                strokeWidth={1.6}
              />
            )}
          </div>
          <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
            {String(
              selectedResource?.description ?? "Tidak ada deskripsi materi.",
            )}
          </p>
          {selectedResource?.file_url ? (
            <a
              href={String(selectedResource.file_url)}
              target="_blank"
              rel="noreferrer"
              className={`mt-6 flex items-center gap-4 rounded-full px-6 py-3 text-sm font-medium text-white transition-colors ${typeActionStyles[String(selectedResource.type ?? "file")] ?? typeActionStyles.file}`}
            >
              {selectedResource.type === "video" ? (
                <Video className="size-5" />
              ) : selectedResource.type === "link" ? (
                <Link2 className="size-5" />
              ) : (
                <FileText className="size-5" />
              )}
              <span className="min-w-0 flex-1 truncate">
                {String(
                  selectedResource.file_name ??
                    selectedResource.title ??
                    (selectedResource.type === "video"
                      ? "Buka video"
                      : selectedResource.type === "link"
                        ? "Buka tautan"
                        : "Unduh materi"),
                )}
              </span>
              {selectedResource.type === "file" ? (
                <Download className="size-5 shrink-0" />
              ) : (
                <ExternalLink className="size-5 shrink-0" />
              )}
            </a>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
