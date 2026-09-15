import { useCallback, useState } from "react";
import { DefaultModulePage } from "@/components/backend-module-page";
import { getAccessToken, getAuthUser } from "@/lib/auth/session";
import { toast } from "sonner";
import { fetchActivityItems } from "./actions";
import { ActivityCategoryManager } from "./components/activity-category-manager";
import { ACTIVITY_ITEMS_PAGE_CONFIG } from "./page.config";
export default function ActivityItemsPage() {
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const exportActivityItems = useCallback(async () => {
    try {
      const institutionName = getAuthUser()?.institution?.name ?? "Institusi";
      const filename = "data_activity_items";
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1"}/export/excel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAccessToken() ?? ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            models: "activity_items",
            title: "Data Item Aktivitas",
            filename,
            pageSize: 500,
            limit: 0,
            filters: [
              {
                key: "type",
                operator: "in",
                value: ["positive", "violation"],
              },
            ],
            column: [
              { key: "name", label: "Nama Aktivitas" },
              { key: "description", label: "Deskripsi" },
              { key: "type", label: "Tipe Aktivitas" },
              { key: "point_value", label: "Nilai Poin" },
              { key: "daily_limit", label: "Batas Harian" },
              { key: "period_limit", label: "Batas Periode" },
              { key: "period_type", label: "Tipe Periode" },
              { key: "is_send_notif", label: "Kirim Notifikasi" },
              { key: "color", label: "Warna" },
              {
                key: "activity_categories.name",
                label: "Kategori",
                table: "activity_categories",
                foreignKey: "category_id",
                alias: "activity_categories",
              },
              { key: "created_at", label: "Tanggal Dibuat" },
              { key: "updated_at", label: "Tanggal Diubah" },
            ],
          }),
        },
      );

      if (!response.ok) throw new Error("Export item aktivitas gagal.");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}_${institutionName}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Data item aktivitas berhasil diekspor.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Export data gagal.",
      );
    }
  }, []);

  return (
    <>
      <DefaultModulePage
        config={ACTIVITY_ITEMS_PAGE_CONFIG}
        fetchPage={fetchActivityItems}
        onExport={() => void exportActivityItems()}
        onToolbarAction={(action) => {
          if (action.href !== "/activity-categories") return false;
          setCategoryManagerOpen(true);
          return true;
        }}
      />
      <ActivityCategoryManager
        open={categoryManagerOpen}
        onOpenChange={setCategoryManagerOpen}
      />
    </>
  );
}
