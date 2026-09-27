import type { BackendModuleConfig } from "@/components/backend-module-page";
import { Badge } from "@/components/ui/badge";

export const LEGAL_DOCUMENTS_PAGE_CONFIG: BackendModuleConfig = {
  endpoint: "/legal-documents",
  model: "legal_document",
  title: "Dokumen Legal",
  description: "Kelola Ketentuan Layanan dan Kebijakan Privasi Qrupi.",
  emptyMessage: "Belum ada dokumen legal",
  actions: {
    view: true,
    create: true,
    edit: true,
    delete: true,
    filter: true,
    export: true,
  },
  fields: [
    { key: "title", title: "Judul" },
    { key: "slug", title: "Jenis" },
    { key: "version", title: "Versi" },
    {
      key: "status",
      title: "Status",
      formatter: (value) => {
        const labels: Record<string, string> = {
          draft: "Draft",
          published: "Published",
          archived: "Archived",
        };
        const styles: Record<string, string> = {
          draft:
            "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900",
          published:
            "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900",
          archived:
            "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-950/50 dark:text-slate-300 dark:ring-slate-900",
        };
        const status = String(value);
        return (
          <Badge
            className={`px-4 py-1 text-xs ${styles[status] ?? "bg-slate-100 text-slate-600 ring-slate-500/20"}`}
          >
            {labels[status] ?? status}
          </Badge>
        );
      },
    },
    { key: "effective_date", title: "Berlaku sejak", type: "date" },
    { key: "updated_at", title: "Diperbarui", type: "date" },
  ],
  editableFields: [
    {
      key: "slug",
      label: "Jenis dokumen",
      type: "text",
      options: [
        { label: "Ketentuan Layanan", value: "terms" },
        { label: "Kebijakan Privasi", value: "privacy" },
      ],
      required: true,
    },
    { key: "title", label: "Judul", type: "text" },
    { key: "version", label: "Versi", type: "text" },
    {
      key: "status",
      label: "Status",
      type: "text",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
        { label: "Archived", value: "archived" },
      ],
      required: true,
    },
    { key: "effective_date", label: "Tanggal berlaku", type: "datetime-local" },
    { key: "content", label: "Isi dokumen", type: "rich-text" },
  ],
};
