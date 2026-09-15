import { useCallback } from "react";
import { DefaultModulePage } from "@/components/backend-module-page";
import { getAccessToken, getAuthUser } from "@/lib/auth/session";
import { toast } from "sonner";
import { fetchActivityCategories } from "./actions";
import { ACTIVITY_CATEGORIES_PAGE_CONFIG } from "./page.config";

export default function ActivityCategoriesPage() {
  const exportActivityCategories = useCallback(async () => {
    try {
      const institutionName = getAuthUser()?.institution?.name ?? "Institusi";
      const filename = "data_activity_categories";
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1"}/export/excel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAccessToken() ?? ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            models: "activity_categories",
            title: "Data Kategori Aktivitas",
            filename,
            pageSize: 500,
            limit: 0,
            filters: [],
            column: [
              { key: "name", label: "Nama Kategori" },
              { key: "description", label: "Deskripsi" },
              { key: "color", label: "Warna" },
              { key: "created_at", label: "Tanggal Dibuat" },
              { key: "updated_at", label: "Tanggal Diubah" },
            ],
          }),
        },
      );

      if (!response.ok) throw new Error("Export kategori aktivitas gagal.");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}_${institutionName}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Data kategori aktivitas berhasil diekspor.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Export data gagal.",
      );
    }
  }, []);

  return (
    <DefaultModulePage
      config={ACTIVITY_CATEGORIES_PAGE_CONFIG}
      fetchPage={fetchActivityCategories}
      onExport={() => void exportActivityCategories()}
    />
  );
}
