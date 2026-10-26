import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DefaultModulePage } from "@/components/backend-module-page";
import { getAuthUser, getRoleName } from "@/lib/auth/session";
import { fetchUsers, type UserCategory } from "./actions";
import { USERS_PAGE_CONFIG } from "./page.config";
import type { PaginationFilters } from "@/lib/api/paginated";
import { toast } from "sonner";
import { getCsrfToken } from "@/lib/auth/session";
import { ImportDialog } from "@/components/import-dialog";

export default function UsersPage() {
  const [searchParams] = useSearchParams();
  const category: UserCategory =
    searchParams.get("category") === "student" ? "student" : "staff";
  const isSuperAdmin = getRoleName(getAuthUser()) === "super_admin";
  const [importOpen, setImportOpen] = useState(false);
  const config = useMemo(
    () => ({
      ...USERS_PAGE_CONFIG,
      filterFields:
        category === "student"
          ? [
              {
                key: "u.name.ilike",
                label: "Nama",
                type: "search" as const,
                placeholder: "Cari siswa...",
              },
              {
                key: "context_code",
                label: "Kode konteks",
                type: "text" as const,
                placeholder: "Cari kode konteks",
              },
              {
                key: "barcode",
                label: "QR",
                type: "text" as const,
                placeholder: "Cari QR",
              },
              {
                key: "rfid_card_code",
                label: "RFID",
                type: "text" as const,
                placeholder: "Cari kode RFID",
              },
              {
                key: "learning_group_id",
                label: "Grup belajar",
                type: "search" as const,
                suggestionEndpoint: "/learning-groups",
                suggestionSearchKey: "lg.name.ilike",
                suggestionFetchOnOpen: true,
                suggestionValueKey: "id",
                placeholder: "Cari grup belajar",
              },
              {
                key: "u.status",
                label: "Status",
                type: "select" as const,
                options: [
                  { label: "Aktif", value: "active" },
                  { label: "Tidak Aktif", value: "inactive" },
                ],
              },
            ]
          : [
              {
                key: "u.name.ilike",
                label: "Nama",
                type: "search" as const,
                placeholder: "Cari guru & admin...",
              },
              {
                key: "context_code",
                label: "No Identitas",
                type: "text" as const,
                placeholder: "Cari no identitas",
              },
              {
                key: "email",
                label: "Email",
                type: "text" as const,
                placeholder: "Cari email",
              },
              {
                key: "type",
                label: "Tipe",
                type: "select" as const,
                options: [
                  { label: "Guru", value: "teacher" },
                  { label: "Admin", value: "admin" },
                ],
              },
              {
                key: "u.status",
                label: "Status",
                type: "select" as const,
                options: [
                  { label: "Aktif", value: "active" },
                  { label: "Tidak Aktif", value: "inactive" },
                ],
              },
            ],
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
      filterAction: category === "student" ? { label: "Generate QR" } : undefined,
    }),
    [category, isSuperAdmin],
  );
  const fetchPage = useCallback(
    (page: number, limit: number, filters?: PaginationFilters) =>
      fetchUsers(page, limit, category, filters),
    [category],
  );

  const exportUsers = useCallback(async (dateRange?: { from: string; to: string }) => {
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
            { key: "barcode", label: "QR" },
            { key: "rfid_card_code", label: "Kode RFID" },
            { key: "created_at", label: "Tanggal Dibuat" },
          ]
        : [
            { key: "name", label: "Nama" },
            { key: "email", label: "Email" },
            { key: "phone", label: "No. Telepon" },
            { key: "context_type", label: "Tipe Identitas" },
            { key: "context_code", label: "No Identitas" },
            { key: "status", label: "Status" },
            { key: "rfid_card_code", label: "Kode RFID" },
            { key: "created_at", label: "Tanggal Dibuat" },
          ];
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1"}/export/excel`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "X-CSRF-Token": getCsrfToken() ?? "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            models: "users",
            title,
            filename,
            pageSize: 500,
            limit: 0,
            filters: [
              ...(dateRange ? [{ key: "created_at", operator: ">=", value: dateRange.from }, { key: "created_at", operator: "<=", value: dateRange.to }] : []),
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

  const generateQr = useCallback(async (filters?: PaginationFilters) => {
    try {
      const params = new URLSearchParams();
      const learningGroupId = filters?.learning_group_id;
      if (learningGroupId) params.set("learning_group_id", String(learningGroupId));
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1"}/export/qrs/pdf${params.toString() ? `?${params.toString()}` : ""}`,
        { credentials: "include" },
      );
      if (!response.ok) throw new Error("Generate QR gagal.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "qr-siswa.pdf";
      link.click();
      URL.revokeObjectURL(url);
      toast.success("QR siswa berhasil dibuat.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generate QR gagal.");
    }
  }, []);

  return (
    <>
      <DefaultModulePage
        config={config}
        fetchPage={fetchPage}
        onExport={(dateRange) => void exportUsers(dateRange)}
        onImport={() => setImportOpen(true)}
        onFilterAction={category === "student" ? (filters) => void generateQr(filters) : undefined}
      />
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title={category === "student" ? "Siswa" : "Guru & Admin"}
        description="Download template terlebih dahulu, isi data sesuai format, lalu upload kembali file Excel untuk diproses."
      />
    </>
  );
}
