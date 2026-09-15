import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { DefaultModulePage } from "@/components/backend-module-page";
import { getAccessToken, getAuthUser, getRoleName } from "@/lib/auth/session";
import { fetchUsers, type UserCategory } from "./actions";
import { USERS_PAGE_CONFIG } from "./page.config";
import type { PaginationFilters } from "@/lib/api/paginated";
import { toast } from "sonner";

export default function UsersPage() {
  const [searchParams] = useSearchParams();
  const category: UserCategory =
    searchParams.get("category") === "student" ? "student" : "staff";
  const isSuperAdmin = getRoleName(getAuthUser()) === "super_admin";
  const config = useMemo(
    () => ({
      ...USERS_PAGE_CONFIG,
      fields: USERS_PAGE_CONFIG.fields.filter((field) => {
        if (category === "student" && field.key === "email") return false;
        if (category !== "student" && field.key === "barcode") return false;
        return isSuperAdmin || field.key !== "institution_name";
      }),
      title: category === "student" ? "Siswa" : "Guru & Admin",
      description:
        category === "student"
          ? "Kelola akun siswa yang terhubung ke institusi."
          : "Kelola akun guru, admin, dan staf institusi.",
      emptyMessage:
        category === "student"
          ? "Belum ada siswa"
          : "Belum ada guru atau admin",
    }),
    [category, isSuperAdmin],
  );
  const fetchPage = useCallback(
    (page: number, limit: number, filters?: PaginationFilters) =>
      fetchUsers(page, limit, category, filters),
    [category],
  );

  const exportUsers = useCallback(async () => {
    try {
      const institutionName = getAuthUser()?.institution?.name ?? "Institusi";
      const isStudent = category === "student";
      const title = isStudent
        ? `Data Siswa ${institutionName}`
        : `Data Guru & admin ${institutionName}`;
      const filename = isStudent ? "data_student" : "data_admin";
      const columns = isStudent
        ? [
            { key: "name", label: "Nama Siswa" },
            { key: "email", label: "Email" },
            { key: "phone", label: "No. Telepon" },
            { key: "context_type", label: "Tipe Identitas" },
            { key: "context_code", label: "No Identitas" },
            { key: "status", label: "Status" },
            { key: "barcode", label: "Barcode" },
            { key: "created_at", label: "Tanggal Dibuat" },
          ]
        : [
            { key: "name", label: "Nama" },
            { key: "email", label: "Email" },
            { key: "phone", label: "No. Telepon" },
            { key: "context_type", label: "Tipe Identitas" },
            { key: "context_code", label: "No Identitas" },
            { key: "status", label: "Status" },
            { key: "created_at", label: "Tanggal Dibuat" },
          ];
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1"}/export/excel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAccessToken() ?? ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            models: "users",
            title,
            filename,
            pageSize: 500,
            limit: 0,
            filters: [
              isStudent
                ? { key: "type", operator: "=", value: "student" }
                : { key: "type", operator: "in", value: ["teacher", "staff", "admin"] },
            ],
            column: columns,
          }),
        },
      );
      if (!response.ok) throw new Error(`Export ${isStudent ? "siswa" : "guru & admin"} gagal.`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}_${institutionName}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Data ${isStudent ? "siswa" : "guru & admin"} berhasil diekspor.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export data gagal.");
    }
  }, [category]);

  return (
    <DefaultModulePage
      config={config}
      fetchPage={fetchPage}
      onExport={() => void exportUsers()}
    />
  );
}
