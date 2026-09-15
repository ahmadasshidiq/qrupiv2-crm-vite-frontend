import { useCallback } from "react";
import { DefaultModulePage } from "@/components/backend-module-page";
import { getAccessToken, getAuthUser } from "@/lib/auth/session";
import { toast } from "sonner";
import { fetchQuizzes } from "./actions";
import { QUIZZES_PAGE_CONFIG } from "./page.config";

export default function QuizzesPage() {
  const exportQuizzes = useCallback(async () => {
    try {
      const institutionName = getAuthUser()?.institution?.name ?? "Institusi";
      const filename = "data_quizzes";
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1"}/export/excel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAccessToken() ?? ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            models: "quizzes",
            title: "Data Quiz",
            filename,
            pageSize: 100,
            limit: 0,
            filters: [
              {
                key: "type",
                operator: "in",
                value: ["quiz", "homework", "midterm", "final"],
              },
            ],
            column: [
              { key: "title", label: "Judul Quiz" },
              { key: "description", label: "Deskripsi" },
              { key: "type", label: "Tipe Quiz" },
              {
                key: "learning_group",
                label: "Grup Pembelajaran",
                table: "learning_groups",
                foreignKey: "learning_group_id",
                alias: "learning_group",
              },
              {
                key: "created_user",
                label: "Dibuat Oleh",
                table: "users",
                foreignKey: "created_user_id",
                alias: "created_user",
              },
              { key: "start_time", label: "Waktu Mulai" },
              { key: "end_time", label: "Waktu Selesai" },
              { key: "duration_minutes", label: "Durasi Menit" },
              {
                key: "max_cheating_warnings",
                label: "Maksimal Peringatan Kecurangan",
              },
              {
                key: "cheating_penalty_minutes",
                label: "Penalty Kecurangan Menit",
              },
              { key: "quiz_questions", label: "Pertanyaan Quiz" },
              { key: "created_at", label: "Tanggal Dibuat" },
              { key: "updated_at", label: "Tanggal Diubah" },
            ],
          }),
        },
      );

      if (!response.ok) throw new Error("Export quiz gagal.");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}_${institutionName}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Data quiz berhasil diekspor.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Export data gagal.",
      );
    }
  }, []);

  return (
    <DefaultModulePage
      config={QUIZZES_PAGE_CONFIG}
      fetchPage={fetchQuizzes}
      onExport={() => void exportQuizzes()}
    />
  );
}
