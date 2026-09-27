/* eslint-disable react-refresh/only-export-components */
import type { BackendModuleConfig } from "@/components/backend-module-page";
import { Badge } from "@/components/ui/badge";
import { truncateDescription } from "@/lib/helper/text";
import type { ApiRecordDto } from "@/lib/dto/api";
import { H5PPlayer } from "@/components/h5p-player";

const RESOURCE_FORM_ONLY_FIELDS = new Set([
  "file",
  "file_url",
  "h5p_content_id",
  "h5p_editor",
  "existing_files",
  "old_file_ids",
]);

function getH5PContentId(record: ApiRecordDto): string {
  if (record.type !== "interactive-media") return "";
  const files = Array.isArray(record.files) ? record.files : [];
  const fileUrl =
    typeof files[0] === "string"
      ? files[0]
      : files[0] && typeof files[0] === "object" && "url" in files[0]
        ? String(files[0].url ?? "")
        : "";
  return fileUrl.match(/\/h5p\/([^/]+)\/play(?:$|[?#])/)?.[1] ?? "";
}

function getResourcePayloadValues(values: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([key]) => !RESOURCE_FORM_ONLY_FIELDS.has(key),
    ),
  );
}

function formatResourceDate(value: unknown) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(String(value)));
}

function LearningResourceDetails({ record }: { record: ApiRecordDto }) {
  const groups = Array.isArray(record.learning_groups) ? record.learning_groups : [];
  const uploader = record.uploaded_user as ApiRecordDto | undefined;
  const files = Array.isArray(record.files) ? record.files : [];
  const type = String(record.type ?? "");
  const typeLabel = type === "interactive-media" ? "Media Interaktif" : "Media";
  const contentId = getH5PContentId(record);
  const groupNames = groups.map((group) => String((group as ApiRecordDto).name ?? "")).filter(Boolean).join(", ");
  const cards = [["Judul materi", record.title], ["Tipe materi", typeLabel], ["Grup penerima", groupNames], ["Deskripsi", record.description]];
  void uploader;
  void files;
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2">{cards.map(([label, value], index) => <div key={String(label)} className={`rounded-xl bg-zinc-50 p-4 dark:bg-white/5 ${index > 1 ? "sm:col-span-2" : ""}`}><dt className="text-xs text-zinc-500">{String(label)}</dt><dd className="mt-1 break-words text-sm font-medium">{String(value ?? "-")}</dd></div>)}</div>{contentId ? <section className="grid gap-2 rounded-lg border border-orange-200 bg-orange-50/60 p-4 dark:border-orange-900/50 dark:bg-orange-950/20"><h3 className="text-sm font-semibold text-orange-900 dark:text-orange-200">Preview media interaktif</h3><H5PPlayer contentId={contentId} /></section> : null}</div>;
  return <div className="space-y-6">
    <section><h3 className="mb-3 text-base font-semibold">Informasi Materi</h3><dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[["Judul", record.title], ["Tipe", typeLabel], ["Pengunggah", uploader?.name ?? record.uploaded_user_name], ["Email pengunggah", uploader?.email], ["Grup penerima", groups.length ? groups.map((group) => String((group as ApiRecordDto).name ?? "")).filter(Boolean).join(", ") : record.learning_group_names], ["Dibuat", formatResourceDate(record.created_at)], ["Diperbarui", formatResourceDate(record.updated_at)]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-zinc-50 p-4 dark:bg-white/5"><dt className="text-xs text-zinc-500">{String(label)}</dt><dd className="mt-1 break-words text-sm font-medium">{String(value ?? "-")}</dd></div>)}
    </dl><p className="mt-3 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-700 dark:bg-white/5 dark:text-zinc-300">{String(record.description ?? "Tidak ada deskripsi.")}</p></section>
    {files.length ? <section><h3 className="mb-3 text-base font-semibold">File atau Tautan Materi</h3><div className="grid gap-2">{files.map((file, index) => { const item = file && typeof file === "object" ? file as ApiRecordDto : {}; const url = String(item.url ?? file ?? ""); return <a key={index} href={url} target="_blank" rel="noreferrer" className="break-all rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">{url}</a>; })}</div></section> : null}
    {contentId ? <section className="grid gap-2 rounded-lg border border-orange-200 bg-orange-50/60 p-4 dark:border-orange-900/50 dark:bg-orange-950/20"><h3 className="text-sm font-semibold text-orange-900 dark:text-orange-200">Preview media interaktif</h3><H5PPlayer contentId={contentId} /></section> : null}
  </div>;
}

export const LEARNING_RESOURCES_PAGE_CONFIG: BackendModuleConfig = {
  title: "Materi Belajar",
  description: "Kelola materi dan sumber pembelajaran.",
  emptyMessage: "Belum ada materi belajar",
  multipart: true,
  createPayload: (values) => {
    const contentId = String(values.h5p_content_id ?? "");
    const isH5P = values.type === "interactive-media";
    const resourceValues = getResourcePayloadValues(values);
    const file = values.file;
    const fileUrl = values.file_url;
    const existingFiles = Array.isArray(values.existing_files)
      ? values.existing_files
      : [];
    const uploadedFiles = Array.isArray(file)
      ? file
      : file instanceof File
        ? [file]
        : [];
    const urls = Array.isArray(fileUrl) ? fileUrl : fileUrl ? [fileUrl] : [];
    return {
      ...resourceValues,
      type: isH5P ? "interactive-media" : "media",
      files:
        isH5P && contentId
          ? [`${window.location.origin}/h5p/${contentId}/play`]
          : [...existingFiles, ...urls],
      ...(uploadedFiles.length > 0 ? { file: uploadedFiles } : {}),
    };
  },
  updatePayload: (values) => {
    const contentId = String(values.h5p_content_id ?? "");
    const isH5P = values.type === "interactive-media";
    const resourceValues = getResourcePayloadValues(values);
    const file = values.file;
    const fileUrl = values.file_url;
    const existingFiles = Array.isArray(values.existing_files)
      ? values.existing_files
      : [];
    const uploadedFiles = Array.isArray(file)
      ? file
      : file instanceof File
        ? [file]
        : [];
    const urls = Array.isArray(fileUrl) ? fileUrl : fileUrl ? [fileUrl] : [];
    return {
      ...resourceValues,
      type: isH5P ? "interactive-media" : "media",
      ...(Array.isArray(values.old_file_ids)
        ? { old_file_ids: values.old_file_ids }
        : {}),
      files:
        isH5P && contentId
          ? [`${window.location.origin}/h5p/${contentId}/play`]
          : [...existingFiles, ...urls],
      ...(uploadedFiles.length > 0 ? { file: uploadedFiles } : {}),
    };
  },
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
        { label: "Media", value: "media" },
        { label: "Media Interaktif", value: "interactive-media" },
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
      type: "url-multi",
      fullWidth: true,
      visibleWhen: { key: "type", values: ["media"] },
      helperText: "Tambahkan satu atau beberapa URL video/tautan.",
    },
    {
      key: "file",
      label: "Upload file materi",
      type: "file-multi",
      fullWidth: true,
      accept: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,image/*,video/*",
      visibleWhen: { key: "type", values: ["media"] },
      helperText: "Unggah dokumen, gambar, atau video materi.",
    },
    {
      key: "h5p_editor",
      label: "Media interaktif H5P",
      type: "h5p-editor",
      fullWidth: true,
      visibleWhen: { key: "type", values: ["interactive-media"] },
      helperText: "Buat dan simpan media interaktif langsung dari LMS.",
    },
    {
      key: "h5p_content_id",
      label: "ID konten H5P",
      type: "hidden",
      visibleWhen: { key: "type", values: ["interactive-media"] },
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
  detailRenderer: (record) =>
    record.type === "interactive-media" ? (
      <LearningResourceDetails record={record} />
    ) : null,
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
          media: "Media",
          "interactive-media": "Media Interaktif",
        };
        const styles: Record<string, string> = {
          media:
            "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-900",
          "interactive-media":
            "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:ring-orange-900",
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
