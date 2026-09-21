import { useCallback } from "react";
import { DefaultModulePage } from "@/components/backend-module-page";
import { getAccessToken, getAuthUser } from "@/lib/auth/session";
import { toast } from "sonner";
import { fetchLearningResources } from "./actions";
import { LEARNING_RESOURCES_PAGE_CONFIG } from "./page.config";

export default function LearningResourcesPage() {
  const exportLearningResources = useCallback(async () => {
    try {
      const institutionName = getAuthUser()?.institution?.name ?? "Institusi";
      const filename = "data_learning_resources";
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1"}/export/excel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAccessToken() ?? ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            models: "learning_resources",
            title: `Data Materi Belajar ${institutionName}`,
            filename,
            pageSize: 500,
            limit: 0,
            filters: [
              {
                key: "type",
                operator: "in",
                value: ["file", "video", "link", "interactive-media"],
              },
            ],
            column: [
              { key: "title", label: "Judul" },
              { key: "description", label: "Deskripsi" },
              { key: "type", label: "Tipe Resource" },
              { key: "file_url", label: "URL Resource" },
              { key: "created_at", label: "Tanggal Dibuat" },
            ],
          }),
        },
      );

      if (!response.ok) throw new Error("Export materi belajar gagal.");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}_${institutionName}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Data materi belajar berhasil diekspor.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export data gagal.");
    }
  }, []);

  return (
    <DefaultModulePage
      config={LEARNING_RESOURCES_PAGE_CONFIG}
      fetchPage={fetchLearningResources}
      onExport={() => void exportLearningResources()}
    />
  );
}
