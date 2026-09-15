import { useCallback } from "react";
import { DefaultModulePage } from "@/components/backend-module-page";
import { getAccessToken, getAuthUser } from "@/lib/auth/session";
import { toast } from "sonner";
import { fetchLearningGroups } from "./actions";
import { LEARNING_GROUPS_PAGE_CONFIG } from "./page.config";

export default function LearningGroupsPage() {
  const exportLearningGroups = useCallback(async () => {
    try {
      const institutionName = getAuthUser()?.institution?.name ?? "Institusi";
      const filename = "data_learning_group";
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1"}/export/excel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAccessToken() ?? ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            models: "learning_groups",
            title: `Data Grup Belajar ${institutionName}`,
            filename,
            pageSize: 500,
            limit: 0,
            filters: [],
            column: [
              { key: "name", label: "Nama Grup Pembelajaran" },
              { key: "code", label: "Kode Grup" },
              { key: "type", label: "Tipe Grup" },
              { key: "level", label: "Level / Tingkat" },
              { key: "major", label: "Peminatan" },
              { key: "department", label: "Program / Mata Pelajaran" },
              { key: "academic_year", label: "Tahun Ajaran" },
              { key: "status", label: "Status" },
              { key: "created_at", label: "Tanggal Dibuat" },
            ],
          }),
        },
      );

      if (!response.ok) throw new Error("Export grup belajar gagal.");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}_${institutionName}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Data grup belajar berhasil diekspor.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export data gagal.");
    }
  }, []);

  return (
    <DefaultModulePage
      config={LEARNING_GROUPS_PAGE_CONFIG}
      fetchPage={fetchLearningGroups}
      onExport={() => void exportLearningGroups()}
    />
  );
}
