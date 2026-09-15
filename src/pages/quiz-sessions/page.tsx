import { useCallback } from "react";
import { DefaultModulePage } from "@/components/backend-module-page";
import { getAccessToken, getAuthUser } from "@/lib/auth/session";
import { toast } from "sonner";
import { fetchQuizSessions } from "./actions";
import { QUIZ_SESSIONS_PAGE_CONFIG } from "./page.config";

export default function QuizSessionsPage() {
  const exportQuizSessions = useCallback(async () => {
    try {
      const institutionName = getAuthUser()?.institution?.name ?? "Institusi";
      const filename = "data_quiz_sessions";
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1"}/export/excel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAccessToken() ?? ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            models: "quiz_sessions",
            title: "Data Riwayat Sesi & Nilai Quiz",
            filename,
            pageSize: 500,
            limit: 0,
            filters: [
              {
                key: "status",
                operator: "in",
                value: ["in_progress", "submitted", "timeout"],
              },
            ],
            column: [
              {
                key: "users.name",
                label: "Nama Siswa",
                table: "users",
                foreignKey: "user_id",
                alias: "session_user",
              },
              {
                key: "quizzes.title",
                label: "Judul Quiz",
                table: "quizzes",
                foreignKey: "quiz_id",
                alias: "session_quiz",
              },
              { key: "start_time", label: "Waktu Mulai" },
              { key: "end_time", label: "Waktu Selesai" },
              { key: "status", label: "Status" },
              { key: "score", label: "Nilai" },
              { key: "cheating_count", label: "Jumlah Kecurangan" },
              { key: "answers", label: "Jawaban" },
              { key: "device_info", label: "Informasi Perangkat" },
              { key: "created_at", label: "Tanggal Dibuat" },
              { key: "updated_at", label: "Tanggal Diubah" },
            ],
          }),
        },
      );

      if (!response.ok) throw new Error("Export sesi quiz gagal.");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}_${institutionName}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Data sesi quiz berhasil diekspor.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Export data gagal.",
      );
    }
  }, []);

  return (
    <DefaultModulePage
      config={QUIZ_SESSIONS_PAGE_CONFIG}
      fetchPage={fetchQuizSessions}
      onExport={() => void exportQuizSessions()}
    />
  );
}
