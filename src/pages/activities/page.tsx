import { useCallback } from "react";
import { DefaultModulePage } from "@/components/backend-module-page";
import { getAccessToken, getAuthUser } from "@/lib/auth/session";
import { toast } from "sonner";
import { fetchActivities } from "./actions";
import { ACTIVITIES_PAGE_CONFIG } from "./page.config";

export default function ActivitiesPage() {
  const exportActivities = useCallback(async () => {
    try {
      const institutionName = getAuthUser()?.institution?.name ?? "Institusi";
      const filename = "data_activities";
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1"}/export/excel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAccessToken() ?? ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            models: "activities",
            title: "Data Aktivitas",
            filename,
            pageSize: 500,
            limit: 0,
            filters: [],
            column: [
              {
                key: "activity_item",
                label: "Nama Aktivitas",
                table: "activity_items",
                foreignKey: "item_id",
                alias: "activity_item",
              },
              {
                key: "users",
                label: "Nama Siswa",
                table: "users",
                foreignKey: "user_id",
                alias: "activity_user",
              },
              {
                key: "users.context_type",
                label: "Tipe Identitas Siswa",
                table: "users",
                foreignKey: "user_id",
                alias: "activity_user",
              },
              {
                key: "users.context_code",
                label: "No. Identitas Siswa",
                table: "users",
                foreignKey: "user_id",
                alias: "activity_user",
              },
              {
                key: "learning_group",
                label: "Grup Pembelajaran",
                table: "learning_groups",
                foreignKey: "learning_group_id",
                alias: "learning_group",
              },
              { key: "description", label: "Catatan" },
              { key: "point_value", label: "Nilai Poin" },
              { key: "platform", label: "Platform" },
              { key: "occurred_at", label: "Waktu Aktivitas" },
              { key: "created_at", label: "Tanggal Dibuat" },
            ],
          }),
        },
      );

      if (!response.ok) throw new Error("Export aktivitas gagal.");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}_${institutionName}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Data aktivitas berhasil diekspor.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Export data gagal.",
      );
    }
  }, []);

  return (
    <DefaultModulePage
      config={ACTIVITIES_PAGE_CONFIG}
      fetchPage={fetchActivities}
      onExport={() => void exportActivities()}
    />
  );
}
