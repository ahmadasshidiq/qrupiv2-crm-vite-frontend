import { useEffect, useState } from "react";
import { CirclePlus, ClipboardList, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { fetchQuizzes } from "@/pages/quizzes/actions";
import type { QuizRow } from "@/pages/quizzes/types";
import { LearningGroupDetailTable } from "./learning-group-detail-table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { deleteResource } from "@/lib/api/resource";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/auth/session";
import { toast } from "sonner";

export function LearningGroupQuizzesList({ groupId }: { groupId: string }) {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<QuizRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canDelete = hasPermission("quizzes", "delete");

  useEffect(() => {
    let active = true;
    void fetchQuizzes(1, 12, { learning_group_id: groupId })
      .then((result) => active && setQuizzes(result.items))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [groupId]);

  const deleteQuiz = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await deleteResource("/quizzes", deleteTarget.id);
      setQuizzes((current) =>
        current.filter((quiz) => quiz.id !== deleteTarget.id),
      );
      toast.success("Kuis berhasil dihapus.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Kuis gagal dihapus.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="border-t border-slate-100 pt-6 dark:border-white/10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
            <ClipboardList className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Kuis</h3>
            <p className="text-xs text-zinc-500">
              {loading ? "Memuat kuis..." : `${quizzes.length} kuis tersedia`}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-blue-500 p-4 text-white hover:bg-blue-600"
          onClick={() =>
            navigate(`/quizzes/create?learning_group_id=${groupId}`)
          }
        >
          <CirclePlus /> Tambah Kuis
        </Button>
      </div>

      {loading ? (
        <div className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-white/10" />
      ) : quizzes.length === 0 ? (
        <div className="rounded-xl border border-slate-200 px-4 py-6 text-center text-sm text-zinc-500 dark:border-white/10">
          Belum ada kuis untuk grup ini.
        </div>
      ) : (
        <LearningGroupDetailTable
          headers={[
            "Judul kuis",
            "Tipe",
            "Durasi (menit)",
            "Jumlah soal",
            ...(canDelete ? ["Aksi"] : []),
          ]}
          rightAlignedLastColumn={canDelete}
        >
          {quizzes.map((quiz) => (
            <TableRow key={String(quiz.id)}>
              <TableCell className="px-4 py-3 font-medium">
                {String(quiz.title ?? "-")}
              </TableCell>
              <TableCell className="px-4 py-3">
                <Badge className="bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-900">
                  {String(quiz.type ?? "-") === "quiz"
                    ? "Kuis"
                    : String(quiz.type ?? "-")}
                </Badge>
              </TableCell>
              <TableCell className="px-4 py-3">
                {String(quiz.duration_minutes ?? "-")}
              </TableCell>
              <TableCell className="px-4 py-3">
                {String(quiz.quiz_count_question ?? "-")}
              </TableCell>
              {canDelete ? (
                <TableCell className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    aria-label="Hapus kuis"
                    onClick={() => setDeleteTarget(quiz)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </LearningGroupDetailTable>
      )}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="w-[calc(100%-1rem)] max-w-lg gap-5 px-6 py-5 sm:max-w-lg sm:px-6">
          <h2 className="text-lg font-semibold">Hapus permanen Kuis</h2>
          <p className="text-sm text-zinc-500">
            Hapus kuis <strong>{String(deleteTarget?.title ?? "ini")}</strong>?
            Tindakan ini tidak dapat dipulihkan.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="p-4"
              onClick={() => setDeleteTarget(null)}
            >
              Batal
            </Button>
            <Button
              className="bg-red-600 p-4 text-white hover:bg-red-700"
              disabled={deleting}
              onClick={() => void deleteQuiz()}
            >
              {deleting ? "Menghapus..." : "Hapus permanen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
