import type { BackendModuleConfig } from "@/components/backend-module-page";
import { Badge } from "@/components/ui/badge";
import { truncateDescription } from "@/lib/helper/text";
import { ExternalLink } from "lucide-react";

export const LEARNING_RESOURCES_PAGE_CONFIG: BackendModuleConfig = {
  title: "Materi Belajar",
  description: "Kelola materi dan sumber pembelajaran.",
  emptyMessage: "Belum ada materi belajar",
  multipart: true,
  editableFields: [
    {
      key: "title",
      label: "Judul materi",
      required: true,
      placeholder: "Contoh: Kurikulum Matematika Kelas 1",
    },
    {
      key: "type",
      label: "Tipe materi",
      required: true,
      options: [
        { label: "File", value: "file" },
        { label: "Video", value: "video" },
        { label: "Tautan", value: "link" },
      ],
    },
    {
      key: "learning_group_ids",
      label: "Grup penerima",
      type: "learning-groups",
      fullWidth: true,
      required: true,
      helperText:
        "Pilih satu atau beberapa grup. Untuk materi dinas, pilih seluruh grup sasaran yang relevan.",
    },
    {
      key: "description",
      label: "Deskripsi",
      type: "textarea",
      placeholder: "Jelaskan isi dan tujuan materi.",
    },
    {
      key: "file_url",
      label: "URL video atau tautan",
      placeholder: "https://...",
      visibleWhen: { key: "type", values: ["video", "link"] },
      helperText: "Masukkan URL untuk materi video atau tautan.",
    },
    {
      key: "file",
      label: "Upload file materi",
      type: "file",
      accept: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,image/*,video/*",
      visibleWhen: { key: "type", values: ["file"] },
      helperText: "Unggah dokumen, gambar, atau video materi.",
    },
    { key: "uploaded_user_id", label: "Pengunggah", type: "hidden" },
  ],
  actions: {
    view: true,
    create: true,
    edit: true,
    archive: true,
    delete: true,
    filter: true,
    import: true,
    export: true,
  },
  renderRowActions: (record) => {
    const fileUrl = String(record.file_url ?? "");
    if (!fileUrl) return null;

    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Buka materi"
        title="Buka materi"
        className="inline-flex size-7 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
      >
        <ExternalLink className="size-3.5" />
      </a>
    );
  },
  fields: [
    {
      key: "learning_group_names",
      title: "Grup belajar",
      formatter: (value) => (
        <span className="block max-w-48 truncate" title={String(value ?? "")}>
          {String(value ?? "-")}
        </span>
      ),
    },
    { key: "institution_name", title: "Institusi" },
    {
      key: "title",
      title: "Judul",
      formatter: (value) => (
        <span className="block max-w-48 truncate" title={String(value ?? "")}>
          {String(value ?? "-")}
        </span>
      ),
    },
    {
      key: "description",
      title: "Deskripsi",
      formatter: (value) => (
        <span className="block max-w-64 truncate" title={String(value ?? "")}>
          {truncateDescription(value)}
        </span>
      ),
    },
    {
      key: "type",
      title: "Tipe",
      formatter: (value) => {
        const type = String(value ?? "");
        const labels: Record<string, string> = {
          file: "File",
          video: "Video",
          link: "Tautan",
        };
        const styles: Record<string, string> = {
          file: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-900",
          video:
            "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-900",
          link: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900",
        };

        return (
          <Badge
            className={`px-4 py-1 text-xs ${styles[type] ?? "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/10"}`}
          >
            {labels[type] ?? "Lainnya"}
          </Badge>
        );
      },
    },
    {
      key: "uploaded_user_name",
      title: "Pengunggah",
      formatter: (value) => (
        <span className="block max-w-40 truncate" title={String(value ?? "")}>
          {String(value ?? "-")}
        </span>
      ),
    },
    { key: "updated_at", title: "Diperbarui", type: "date" },
  ],
};
