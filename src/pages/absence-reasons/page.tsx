import { useCallback } from "react";
import { DefaultModulePage } from "@/components/backend-module-page";
import { getAccessToken, getAuthUser } from "@/lib/auth/session";
import { toast } from "sonner";
import { fetchAbsenceReasons } from "./actions";
import { ABSENCE_REASONS_PAGE_CONFIG } from "./page.config";

export default function AbsenceReasonsPage() {
  const exportAbsenceReasons = useCallback(async () => {
    try {
      const institutionName = getAuthUser()?.institution?.name ?? "Institusi";
      const filename = "data_attendance_absence_reasons";
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1"}/export/excel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAccessToken() ?? ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            models: "attendance_absence_reasons",
            title: "Data Alasan Absensi",
            filename,
            pageSize: 500,
            limit: 0,
            filters: [],
            column: [
              { key: "name", label: "Nama Alasan" },
              { key: "description", label: "Deskripsi" },
              { key: "created_at", label: "Tanggal Dibuat" },
              { key: "updated_at", label: "Tanggal Diubah" },
            ],
          }),
        },
      );

      if (!response.ok) throw new Error("Export alasan absensi gagal.");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}_${institutionName}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Data alasan absensi berhasil diekspor.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Export data gagal.",
      );
    }
  }, []);

  return (
    <DefaultModulePage
      config={ABSENCE_REASONS_PAGE_CONFIG}
      fetchPage={fetchAbsenceReasons}
      onExport={() => void exportAbsenceReasons()}
    />
  );
}
