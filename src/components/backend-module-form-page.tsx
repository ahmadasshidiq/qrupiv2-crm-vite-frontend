import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CircleHelp,
  ExternalLink,
  FileText,
  Image,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  type BackendModuleConfig,
  type ModuleFormField,
} from "@/components/backend-module-page";
import { getModuleBehavior } from "@/lib/module-behaviors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RegionSelect } from "@/components/region-select";
import { RoleSelect } from "@/components/role-select";
import { LearningGroupMultiSelect } from "@/components/learning-group-multi-select";
import { ActivityCategorySelect } from "@/components/activity-category-select";
import { ResourceAutocomplete } from "@/components/resource-autocomplete";
import { TeacherMultiSelect } from "@/components/teacher-multi-select";
import { QuizQuestionEditor } from "@/components/quiz-question-editor";
import { getAuthUser } from "@/lib/auth/session";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import {
  createResource,
  fetchResourceById,
  updateResource,
} from "@/lib/api/resource";
import type { ApiRecordDto } from "@/lib/dto/api";
import { toast } from "sonner";
import { H5PEditor, type H5PEditorHandle } from "@/components/h5p-editor";

type ModuleFormPageProps = {
  config: BackendModuleConfig;
  mode: "create" | "edit" | "view";
  initialValues?: Record<string, string>;
};

function getH5PContentId(record: ApiRecordDto | null): string {
  if (!record || record.type !== "interactive-media") return "";
  const files = Array.isArray(record.files) ? record.files : [];
  const fileUrl = typeof files[0] === "string" ? files[0] : "";
  return fileUrl.match(/\/h5p\/([^/]+)\/play(?:$|[?#])/)?.[1] ?? "";
}

export function BackendModuleFormPage({
  config,
  mode,
  initialValues: pageInitialValues = {},
}: ModuleFormPageProps) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const behavior = getModuleBehavior(config);
  const fields = config.editableFields ?? behavior.fields;
  const [record, setRecord] = useState<ApiRecordDto | null>(null);
  const [loading, setLoading] = useState(mode !== "create");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "create" || !id) return;
    let active = true;
    void fetchResourceById(behavior.endpoint, id)
      .then((data) => {
        if (!active) return;
        setRecord(data);
      })
      .catch((error) => {
        if (!active) return;
        const message =
          error instanceof ApiError
            ? error.message
            : "Detail data gagal dimuat.";
        setErrorMessage(message);
        toast.error(message);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [behavior.endpoint, config.title, id, mode]);

  const pageTitle =
    mode === "create"
      ? `Tambah ${config.title}`
      : mode === "edit"
        ? `Edit ${config.title}`
        : `Detail ${config.title}`;
  const quizDefaults =
    mode === "create" && config.title === "Kuis" ? getQuizDateDefaults() : {};

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:px-10">
      <div className="mb-6">
        <Button
          variant="ghost"
          className="mb-3 -ml-3"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft /> Kembali
        </Button>
        <h2 className="text-xl font-bold tracking-tight">{pageTitle}</h2>
        <p className="mt-1 text-xs text-zinc-500">
          {mode === "view"
            ? "Informasi lengkap data yang telah tersimpan."
            : "Ikuti petunjuk di setiap kolom agar data tersimpan dengan benar."}
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.04] sm:p-8">
        {loading ? (
          <p className="text-sm text-zinc-500">Memuat data...</p>
        ) : null}
        {errorMessage ? (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
            {errorMessage}
          </p>
        ) : null}
        {!loading && !errorMessage ? (
          mode === "view" ? (
            <div className="space-y-6">
              <RecordDetails record={record} fields={fields} />
              {record && config.detailRenderer?.(record)}
            </div>
          ) : (
            <RecordForm
              title={config.title}
              fields={fields}
              record={record}
              isCreate={mode === "create"}
              initialValues={{
                ...quizDefaults,
                ...(mode === "create" &&
                config.behaviorKey === "Pengguna" &&
                searchParams.get("category") === "student"
                  ? { type: "student" }
                  : {}),
                ...(mode === "create" && searchParams.get("learning_group_id")
                  ? {
                      learning_group_id:
                        searchParams.get("learning_group_id") ?? "",
                      learning_group_ids:
                        searchParams.get("learning_group_id") ?? "",
                    }
                  : {}),
                ...pageInitialValues,
              }}
              saving={saving}
              onCancel={() => navigate(-1)}
              onSubmit={async (values) => {
                setSaving(true);
                setErrorMessage(null);

                try {
                  const payload = config.createPayload
                    ? config.createPayload(values)
                    : values;

                  if (mode === "create") {
                    await createResource(
                      config.createEndpoint ?? behavior.endpoint,
                      payload,
                      config.multipart ?? behavior.multipart,
                    );
                  } else if (id) {
                    const updatePayload = config.updatePayload
                      ? config.updatePayload(values)
                      : values;

                    await updateResource(
                      behavior.endpoint,
                      id,
                      updatePayload,
                      config.multipart ?? behavior.multipart,
                    );
                  }

                  toast.success(
                    mode === "create"
                      ? `${config.title} berhasil ditambahkan.`
                      : `${config.title} berhasil diperbarui.`,
                  );

                  navigate(-1);
                } catch (error) {
                  const message =
                    error instanceof ApiError
                      ? error.message
                      : "Data gagal disimpan.";

                  toast.error(message);
                } finally {
                  setSaving(false);
                }
              }}
            />
          )
        ) : null}
      </section>
    </main>
  );
}

function RecordDetails({
  record,
  fields,
}: {
  record: ApiRecordDto | null;
  fields: ModuleFormField[];
}) {
  return (
    <dl className="grid min-w-0 gap-4 sm:grid-cols-2">
      {fields
        .filter((field) => {
          if (field.key === "password" || field.key === "pin") return false;
          if (field.key === "h5p_editor" || field.key === "h5p_content_id") {
            return false;
          }
          if (field.type === "hidden") return field.key === "institution_id";
          if (!field.visibleWhen) return true;
          return field.visibleWhen.values.includes(
            String(record?.[field.visibleWhen.key] ?? ""),
          );
        })
        .map((field) => (
          <RecordDetailCard key={field.key} field={field} record={record} />
        ))}
    </dl>
  );
}

const userTypeLabels: Record<string, string> = {
  student: "Siswa",
  teacher: "Guru",
  admin: "Admin",
  staff: "Staf",
};

function RecordDetailCard({
  field,
  record,
}: {
  field: ModuleFormField;
  record: ApiRecordDto | null;
}) {
  const value = record?.[field.key];
  const learningGroupNames =
    field.type === "learning-groups" || field.type === "resource-multi"
      ? Array.isArray(record?.learning_groups)
        ? record.learning_groups
            .map((group) => {
              if (!group || typeof group !== "object") return "";
              return String((group as ApiRecordDto).name ?? "");
            })
            .filter(Boolean)
            .join(", ")
        : String(record?.learning_group_names ?? "")
      : "";
  const [resolvedName, setResolvedName] = useState("");
  const isRole = field.type === "role";
  const isInstitution =
    field.key === "institution_id" || field.key === "institution_name";
  const isActivityCategory = field.type === "activity-category";
  const isResource =
    field.type === "resource" && Boolean(field.resourceEndpoint);
  const resourceId =
    field.key === "institution_name"
      ? String(record?.institution_id ?? "")
      : typeof value === "string"
        ? value
        : "";
  const relatedNameKey = field.key.replace(/_id$/, "_name");
  const embeddedName = isInstitution
    ? (record?.institution_name ??
      (record?.institution && typeof record.institution === "object"
        ? (record.institution as ApiRecordDto).name
        : undefined))
    : isRole
      ? record?.role_name
      : record?.[relatedNameKey];
  const resourceEndpoint = isRole
    ? "/roles"
    : isInstitution
      ? "/institutions"
      : isActivityCategory
        ? "/activity-categories"
        : isResource
          ? field.resourceEndpoint
          : undefined;

  useEffect(() => {
    if (!resourceId || embeddedName || !resourceEndpoint) return;
    let active = true;

    void fetchResourceById(resourceEndpoint, resourceId)
      .then((data) => {
        if (!active) return;
        setResolvedName(
          String(data.name ?? data.title ?? data.email ?? data.slug ?? ""),
        );
      })
      .catch(() => active && setResolvedName(""));

    return () => {
      active = false;
    };
  }, [embeddedName, resourceEndpoint, resourceId]);

  const fileUrl =
    field.type === "file" && typeof (record?.file_url ?? value) === "string"
      ? String(record?.file_url ?? value)
      : null;
  const resourceFilePattern =
    /\.(pdf|docx?|xlsx?|pptx?|zip|csv|txt|jpe?g|png|gif|webp|mp4|webm|mov)(?:$|\?)/i;
  const resourceFiles =
    (field.key === "file_url" || field.key === "file") &&
    Array.isArray(record?.files)
      ? record.files
          .map((file) =>
            typeof file === "string"
              ? file
              : file && typeof file === "object" && "url" in file
                ? String(file.url ?? "")
                : "",
          )
          .filter(Boolean)
          .filter((file) =>
            field.key === "file"
              ? resourceFilePattern.test(file)
              : !resourceFilePattern.test(file),
          )
      : [];
  const isImageFile = field.accept?.startsWith("image/") ?? false;
  const avatarUrl =
    (field.key === "avatar_url" || (field.type === "file" && isImageFile)) &&
    typeof (record?.avatar_url ?? record?.file_url ?? value) === "string"
      ? String(record?.avatar_url ?? record?.file_url ?? value)
      : null;
  const institutionName = String(
    record?.institution_name ??
      (record?.institution && typeof record.institution === "object"
        ? (record.institution as ApiRecordDto).name
        : undefined) ??
      resolvedName ??
      "",
  );
  const roleName = String(record?.role_name ?? resolvedName ?? "");
  const resourceName = String(embeddedName ?? resolvedName ?? "");
  const optionLabel = field.options?.find(
    (option) => String(option.value) === String(value ?? ""),
  )?.label;
  const label = isInstitution ? "Institusi" : field.label;
  const displayValue = isInstitution
    ? institutionName || "-"
    : isRole
      ? roleName || "-"
      : isActivityCategory
        ? resourceName || "-"
        : isResource
          ? resourceName || "-"
          : field.type === "learning-groups"
            ? learningGroupNames || "-"
            : field.type === "quiz-questions"
              ? Array.isArray(value)
                ? `${value.length} soal`
                : "-"
              : field.type === "datetime-local"
                ? formatDetailDateTime(value)
                : optionLabel
                  ? optionLabel
                  : field.key === "type"
                    ? (userTypeLabels[String(value ?? "")] ??
                      String(value ?? "-"))
                    : field.key === "status"
                      ? value === "active" || value === true
                        ? "Aktif"
                        : "Tidak Aktif"
                      : String(value ?? "-");

  return (
    <div
      className={`min-w-0 max-w-full overflow-hidden rounded-xl bg-zinc-50 p-4 dark:bg-white/5 ${field.type === "textarea" || field.type === "learning-groups" ? "sm:col-span-2" : ""}`}
    >
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-1 min-w-0 max-w-full break-words text-sm font-medium">
        {fileUrl && !isImageFile ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60"
          >
            <FileText className="size-4" /> Buka file{" "}
            <ExternalLink className="size-3.5" />
          </a>
        ) : resourceFiles.length > 0 ? (
          <ul className="grid gap-2">
            {resourceFiles.map((resourceFile) => (
              <li key={resourceFile}>
                <a
                  href={resourceFile}
                  target="_blank"
                  rel="noreferrer"
                  className="box-border flex w-full min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60"
                  title={resourceFile}
                >
                  <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {resourceFile.split("/").pop() || resourceFile}
                  </span>
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        ) : avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Foto profil"
            className="size-16 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-white/10"
          />
        ) : (
          displayValue
        )}
      </dd>
    </div>
  );
}

function RecordForm({
  title,
  fields,
  record,
  isCreate,
  initialValues,
  saving,
  onCancel,
  onSubmit,
}: {
  title: string;
  fields: ModuleFormField[];
  record: ApiRecordDto | null;
  isCreate: boolean;
  initialValues: Record<string, string>;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
}) {
  const [selectValues, setSelectValues] = useState(() =>
    Object.fromEntries(
      fields
        .filter((field) => field.key === "status" || field.options)
        .map((field) => [
          field.key,
          field.key === "status"
            ? (normalizeStatus(record?.[field.key]) ?? "active")
            : String(
                record?.[field.key] ??
                  initialValues[field.key] ??
                  field.options?.[0]?.value ??
                  "",
              ),
        ]),
    ),
  );
  const [regionCodes, setRegionCodes] = useState(() => ({
    province_code: String(record?.province_code ?? ""),
    regency_code: String(record?.regency_code ?? ""),
    district_code: String(record?.district_code ?? ""),
    village_code: String(record?.village_code ?? ""),
  }));
  const [roleId, setRoleId] = useState(() => String(record?.role_id ?? ""));
  const [activityCategoryId, setActivityCategoryId] = useState(() =>
    String(record?.category_id ?? ""),
  );
  const [resourceValues, setResourceValues] = useState(() =>
    Object.fromEntries(
      fields
        .filter(
          (field) =>
            field.type === "resource" || field.type === "resource-multi",
        )
        .map((field) => [
          field.key,
          String(record?.[field.key] ?? initialValues[field.key] ?? ""),
        ]),
    ),
  );
  const [learningGroupIds, setLearningGroupIds] = useState(() => {
    const value =
      record?.learning_group_ids ?? initialValues.learning_group_ids;
    if (Array.isArray(value)) return value.map(String);
    return value ? [String(value)] : [];
  });
  const institutionId = getAuthUser()?.institution?.id ?? "";
  const isQuizForm = title === "Kuis";
  const [quizDuration, setQuizDuration] = useState(() =>
    isQuizForm
      ? (calculateDurationMinutes(
          String(record?.start_time ?? initialValues.start_time ?? ""),
          String(record?.end_time ?? initialValues.end_time ?? ""),
        ) ??
        String(
          record?.duration_minutes ?? initialValues.duration_minutes ?? "",
        ))
      : "",
  );
  const [h5pContentId, setH5pContentId] = useState(() =>
    String(record?.h5p_content_id ?? initialValues.h5p_content_id ?? ""),
  );
  const h5pEditorRef = useRef<H5PEditorHandle>(null);

  const updateRegion = (
    key: "province_code" | "regency_code" | "district_code" | "village_code",
    code: string,
  ) => {
    setRegionCodes((current) => {
      if (key === "province_code")
        return {
          province_code: code,
          regency_code: "",
          district_code: "",
          village_code: "",
        };
      if (key === "regency_code")
        return {
          ...current,
          regency_code: code,
          district_code: "",
          village_code: "",
        };
      if (key === "district_code")
        return { ...current, district_code: code, village_code: "" };
      return { ...current, village_code: code };
    });
  };

  return (
    <form
      className="grid gap-6 sm:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const formValues = Object.fromEntries(
          new FormData(event.currentTarget),
        ) as Record<string, unknown>;
        const submittedExistingFiles = new FormData(event.currentTarget).getAll(
          "existing_files",
        );
        formValues.existing_files = submittedExistingFiles;
        const submittedResourceUrls = new Set(
          [
            ...submittedExistingFiles,
            ...new FormData(event.currentTarget).getAll("file_url"),
          ]
            .map(String)
            .filter(Boolean),
        );
        formValues.old_file_ids = Array.isArray(record?.files)
          ? record.files
              .filter(
                (file) =>
                  file &&
                  typeof file === "object" &&
                  "id" in file &&
                  "url" in file &&
                  submittedResourceUrls.has(String(file.url ?? "")),
              )
              .map((file) => String(file.id ?? ""))
              .filter(Boolean)
          : [];
        const contentId =
          selectValues.type === "interactive-media" && !h5pContentId
            ? await h5pEditorRef.current?.save()
            : h5pContentId;
        if (selectValues.type === "interactive-media" && !contentId) {
          toast.error("Simpan media H5P terlebih dahulu.");
          return;
        }
        formValues.h5p_content_id = contentId ?? "";
        const values = fields.reduce<Record<string, unknown>>(
          (result, field) => {
            const value = formValues[field.key];
            result[field.key] =
              field.type === "learning-groups" ||
              field.type === "resource-multi" ||
              field.type === "file-multi" ||
              field.type === "url-multi"
                ? (() => {
                    const fieldValues = new FormData(
                      event.currentTarget,
                    ).getAll(field.key);
                    return field.type === "file-multi"
                      ? fieldValues.filter(
                          (item): item is File => item instanceof File,
                        )
                      : fieldValues.map(String);
                  })()
                : field.type === "quiz-questions" && typeof value === "string"
                  ? JSON.parse(value)
                  : field.type === "number" &&
                      typeof value === "string" &&
                      value !== ""
                    ? Number(value)
                    : field.type === "datetime-local" &&
                        typeof value === "string" &&
                        value
                      ? toRfc3339(value)
                      : field.type === "boolean" ||
                          field.key === "requires_check_out"
                        ? value === "true"
                        : value;
            return result;
          },
          {},
        );
        values.old_file_ids = formValues.old_file_ids;
        void onSubmit(values);
      }}
      onChange={(event) => {
        if (!isQuizForm) return;
        const target = event.target as unknown as HTMLInputElement;
        if (target.name !== "start_time" && target.name !== "end_time") return;
        const formData = new FormData(event.currentTarget);
        const duration = calculateDurationMinutes(
          String(formData.get("start_time") ?? ""),
          String(formData.get("end_time") ?? ""),
        );
        if (duration !== null) setQuizDuration(String(duration));
      }}
    >
      <div className="sm:col-span-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Informasi {title}
        </h3>
        <div className="mt-3 flex gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs leading-5 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
          <CircleHelp className="mt-0.5 size-4 shrink-0" />
          <p>
            Isi setiap kolom dengan data yang sesuai. Contoh dan penjelasan di
            bawah kolom membantu Anda menentukan informasi yang perlu diisi.
          </p>
        </div>
      </div>
      {fields
        .filter((field) => field.type === "hidden")
        .map((field) => (
          <input
            key={field.key}
            type="hidden"
            name={field.key}
            value={
              field.key === "institution_id"
                ? institutionId
                : field.key === "uploaded_user_id"
                  ? String(getAuthUser()?.id ?? "")
                  : field.key === "recorded_user_id"
                    ? String(getAuthUser()?.id ?? "")
                    : field.key === "created_user_id"
                      ? String(getAuthUser()?.id ?? "")
                      : String(
                          record?.[field.key] ?? initialValues[field.key] ?? "",
                        )
            }
          />
        ))}
      {fields
        .filter((field) => {
          if (field.type === "hidden") return false;
          if (!field.visibleWhen) return true;
          return field.visibleWhen.values.includes(
            selectValues[field.visibleWhen.key] ?? "",
          );
        })
        .map((field) => {
          const guidance = getFieldGuidance(field);
          const selectOptions = field.options ?? [
            { label: "Aktif", value: "active" },
            { label: "Tidak Aktif", value: "inactive" },
          ];
          const selectedValue =
            selectValues[field.key] ?? selectOptions[0]?.value ?? "";
          const selectedLabel =
            selectOptions.find((option) => option.value === selectedValue)
              ?.label ?? "Pilih opsi";
          const isRequired =
            field.required ||
            (isCreate && field.requiredWhen
              ? field.requiredWhen.values.includes(
                  selectValues[field.requiredWhen.key] ?? "",
                )
              : false);
          return (
            <div
              key={field.key}
              className={
                field.type === "textarea" || field.fullWidth
                  ? "grid gap-1.5 sm:col-span-2"
                  : "grid gap-1.5"
              }
            >
              {field.type === "h5p-editor" ? (
                <>
                  <Label
                    htmlFor={"h5p-editor"}
                    className="text-sm text-slate-800 dark:text-slate-100"
                  >
                    H5P Editor
                  </Label>
                  <H5PEditor
                    ref={h5pEditorRef}
                    contentId={h5pContentId || getH5PContentId(record) || "new"}
                    onSaved={(contentId) => {
                      setH5pContentId(contentId);
                      toast.success("Media H5P berhasil disimpan.");
                    }}
                  />
                  <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {guidance.helperText}
                  </p>
                </>
              ) : null}
              {field.type === "h5p-editor" ? null : (
                <Label
                  htmlFor={field.key}
                  className="text-sm text-slate-800 dark:text-slate-100"
                >
                  {field.label}
                </Label>
              )}
              {field.type === "h5p-editor" ? null : field.type === "role" ? (
                <RoleSelect
                  name={field.key}
                  value={roleId}
                  required={isRequired}
                  onValueChange={setRoleId}
                />
              ) : field.type === "activity-category" ? (
                <ActivityCategorySelect
                  name={field.key}
                  value={activityCategoryId}
                  required={isRequired}
                  onValueChange={setActivityCategoryId}
                />
              ) : field.type === "resource" && field.resourceEndpoint ? (
                <ResourceAutocomplete
                  name={field.key}
                  value={resourceValues[field.key] ?? ""}
                  endpoint={field.resourceEndpoint}
                  filters={field.resourceFilters}
                  placeholder={field.resourcePlaceholder}
                  required={isRequired}
                  onValueChange={(value) =>
                    setResourceValues((current) => ({
                      ...current,
                      [field.key]: value,
                    }))
                  }
                />
              ) : field.type === "resource-multi" && field.resourceEndpoint ? (
                <TeacherMultiSelect
                  name={field.key}
                  value={
                    resourceValues[field.key]
                      ? resourceValues[field.key].split(",")
                      : []
                  }
                  endpoint={field.resourceEndpoint}
                  filters={field.resourceFilters}
                  placeholder={field.resourcePlaceholder}
                  required={isRequired}
                  onValueChange={(value) =>
                    setResourceValues((current) => ({
                      ...current,
                      [field.key]: value.join(","),
                    }))
                  }
                />
              ) : field.type === "learning-groups" ? (
                <LearningGroupMultiSelect
                  name={field.key}
                  value={learningGroupIds}
                  required={isRequired}
                  onValueChange={setLearningGroupIds}
                />
              ) : field.type === "quiz-questions" ? (
                <QuizQuestionEditor
                  name={field.key}
                  required={isRequired}
                  initialQuestions={
                    Array.isArray(record?.[field.key])
                      ? record[field.key]
                      : undefined
                  }
                />
              ) : field.type === "color" ? (
                <ColorField
                  field={field}
                  value={toInputValue(record?.[field.key], field.type)}
                  required={isRequired}
                />
              ) : field.key === "status" || field.options ? (
                <Select
                  name={field.key}
                  value={selectedValue}
                  onValueChange={(value) =>
                    setSelectValues((current) => ({
                      ...current,
                      [field.key]: value ?? "",
                    }))
                  }
                >
                  <SelectTrigger
                    className="!h-10 !w-full !bg-white !px-3 font-normal dark:!bg-white/[0.03]"
                    style={{ fontSize: "0.75rem", lineHeight: "1.625" }}
                  >
                    <span className="flex-1 text-left font-normal">
                      {selectedLabel}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {selectOptions.map((option) => (
                      <SelectItem
                        className="!text-sm"
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === "file-multi" ? (
                <MultipleFilesField
                  field={field}
                  required={isRequired}
                  existingFiles={getResourceFiles(record, "file")}
                />
              ) : field.type === "url-multi" ? (
                <MultipleUrlsField
                  field={field}
                  required={isRequired}
                  initialUrls={getResourceFiles(record, "url")}
                />
              ) : field.type === "file" ? (
                <FileUploadField
                  field={field}
                  required={isRequired}
                  currentFileUrl={
                    typeof (record?.avatar_url ?? record?.file_url) === "string"
                      ? String(record?.avatar_url ?? record?.file_url)
                      : undefined
                  }
                />
              ) : field.type === "region" && field.regionLevel ? (
                <RegionSelect
                  key={`${field.key}-${regionCodes[field.key as keyof typeof regionCodes]}`}
                  name={field.key}
                  level={field.regionLevel}
                  value={regionCodes[field.key as keyof typeof regionCodes]}
                  placeholder={guidance.placeholder}
                  disabled={
                    (field.regionLevel === "regency" &&
                      !regionCodes.province_code) ||
                    (field.regionLevel === "district" &&
                      !regionCodes.regency_code) ||
                    (field.regionLevel === "village" &&
                      !regionCodes.district_code)
                  }
                  filters={
                    field.regionLevel === "regency"
                      ? { province_code: regionCodes.province_code }
                      : field.regionLevel === "district"
                        ? { regency_code: regionCodes.regency_code }
                        : field.regionLevel === "village"
                          ? { district_code: regionCodes.district_code }
                          : {}
                  }
                  onValueChange={(code) =>
                    updateRegion(field.key as keyof typeof regionCodes, code)
                  }
                />
              ) : field.type === "textarea" ? (
                <Textarea
                  id={field.key}
                  name={field.key}
                  placeholder={guidance.placeholder}
                  className="min-h-24 bg-white px-3 py-2 text-sm dark:bg-white/[0.03]"
                  defaultValue={String(record?.[field.key] ?? "")}
                  required={isRequired}
                />
              ) : (
                <Input
                  id={field.key}
                  name={field.key}
                  type={getInputType(field)}
                  placeholder={guidance.placeholder}
                  className="h-10 bg-white px-3 text-sm dark:bg-white/[0.03]"
                  defaultValue={
                    isQuizForm && field.key === "duration_minutes"
                      ? undefined
                      : toInputValue(
                          record?.[field.key] ?? initialValues[field.key],
                          field.type,
                        )
                  }
                  value={
                    isQuizForm && field.key === "duration_minutes"
                      ? quizDuration
                      : undefined
                  }
                  readOnly={isQuizForm && field.key === "duration_minutes"}
                  accept={field.accept}
                  required={isRequired}
                />
              )}
              {field.type !== "h5p-editor" ? (
                <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {guidance.helperText}
                </p>
              ) : null}
            </div>
          );
        })}
      <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-100 pt-6 sm:col-span-2 sm:flex-row dark:border-white/10">
        <Button
          className="p-4"
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Batal
        </Button>
        <Button
          className="p-4 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
          type="submit"
          disabled={saving}
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}

function getInputType(field: ModuleFormField) {
  if (
    field.type &&
    field.type !== "textarea" &&
    field.type !== "region" &&
    field.type !== "boolean" &&
    field.type !== "role" &&
    field.type !== "activity-category" &&
    field.type !== "resource" &&
    field.type !== "learning-groups" &&
    field.type !== "quiz-questions"
  )
    return field.type;
  if (field.key.includes("email")) return "email";
  if (field.key.includes("phone")) return "tel";
  if (field.key.includes("website") || field.key.includes("url")) return "url";
  return "text";
}

function FileUploadField({
  field,
  currentFileUrl,
  required,
}: {
  field: ModuleFormField;
  currentFileUrl?: string;
  required?: boolean;
}) {
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const imageUrl = previewUrl || currentFileUrl;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileName(file?.name ?? "");
    setPreviewUrl(file ? URL.createObjectURL(file) : "");
  };

  return (
    <div className="flex items-center gap-3">
      <input
        id={field.key}
        name={field.key}
        type="file"
        accept={field.accept}
        className="sr-only"
        required={required}
        onChange={handleFileChange}
      />
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.03]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Preview logo institusi"
            className="size-full object-cover"
          />
        ) : (
          <Image className="size-5 text-slate-400 dark:text-slate-500" />
        )}
      </div>
      <label
        htmlFor={field.key}
        className="flex h-10 min-w-0 flex-1 cursor-pointer items-center rounded-md border border-input bg-white px-1.5 text-sm transition-colors hover:border-slate-400 dark:bg-white/[0.03] dark:hover:border-white/25"
      >
        <span className="inline-flex h-7 shrink-0 items-center rounded bg-slate-100 px-2.5 text-xs font-medium text-slate-700 dark:bg-white/10 dark:text-slate-200">
          Pilih gambar
        </span>
        <span className="min-w-0 truncate px-2 text-xs text-slate-500 dark:text-slate-400">
          {fileName ||
            (currentFileUrl ? "Logo saat ini" : "Belum ada file dipilih")}
        </span>
      </label>
    </div>
  );
}

function MultipleFilesField({
  field,
  required,
  existingFiles = [],
}: {
  field: ModuleFormField;
  required?: boolean;
  existingFiles?: string[];
}) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [remainingFiles, setRemainingFiles] = useState(existingFiles);

  return (
    <div className="grid gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4 dark:border-white/15 dark:bg-white/[0.03]">
      <input
        id={field.key}
        name={field.key}
        type="file"
        multiple
        accept={field.accept}
        className="sr-only"
        required={required}
        onChange={(event) =>
          setSelectedFiles(Array.from(event.target.files ?? []))
        }
      />

      <label
        htmlFor={field.key}
        className="
    group flex cursor-pointer items-center gap-4
    rounded-xl border border-dashed border-slate-300
    bg-slate-50/50 px-5 py-4
    transition-all
    hover:border-blue-400 hover:bg-blue-50/50
    dark:border-white/15 dark:bg-white/[0.02]
    dark:hover:border-blue-500/60 dark:hover:bg-blue-950/20
  "
      >
        <div
          className="
      flex size-11 shrink-0 items-center justify-center
      rounded-lg bg-blue-50 text-blue-600
      transition-colors
      group-hover:bg-blue-100
      dark:bg-blue-500/10 dark:text-blue-400
    "
        >
          <UploadCloud className="size-5" />
        </div>

        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Pilih atau tarik file ke sini
          </p>

          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Bisa memilih beberapa file sekaligus
          </p>
        </div>

        <span
          className="
      shrink-0 rounded-lg border border-blue-200
      bg-blue-50 px-3 py-2
      text-xs font-medium text-blue-600
      transition-colors
      group-hover:bg-blue-100
      dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400
    "
        >
          Pilih file
        </span>
      </label>
      {existingFiles.length > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-white/[0.03]">
          <p className="font-medium text-slate-700 dark:text-slate-200">
            File tersimpan
          </p>
          <ul className="mt-1 grid gap-2">
            {remainingFiles.map((fileUrl) => (
              <li key={fileUrl} className="flex min-w-0 items-center gap-1">
                <a
                  className="min-w-0 flex-1 truncate text-blue-600 hover:underline dark:text-blue-400"
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={fileUrl}
                >
                  {fileUrl.split("/").pop() || fileUrl}
                </a>
                <input type="hidden" name="existing_files" value={fileUrl} />
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Buka file"
                  title="Buka file"
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  <ExternalLink className="size-4" />
                </a>
                <a
                  onClick={() =>
                    setRemainingFiles((current) =>
                      current.filter((item) => item !== fileUrl),
                    )
                  }
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Delete"
                  title="Delete"
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-red-600 transition-colors hover:bg-slate-100 hover:text-red-600 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  <Trash2 className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {selectedFiles.length > 0 ? (
        <div className="rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs text-slate-600 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-slate-300">
          <p className="font-medium text-blue-800 dark:text-blue-200">
            {selectedFiles.length} file dipilih
          </p>
          <ul className="mt-1 grid gap-1">
            {selectedFiles.map((file) => (
              <li
                className="truncate"
                key={`${file.name}-${file.size}-${file.lastModified}`}
                title={file.name}
              >
                {file.name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function MultipleUrlsField({
  field,
  required,
  initialUrls = [],
}: {
  field: ModuleFormField;
  required?: boolean;
  initialUrls?: string[];
}) {
  const [urls, setUrls] = useState(initialUrls.length > 0 ? initialUrls : [""]);
  return (
    <div className="grid gap-2">
      {urls.map((url, index) => (
        <div key={`${field.key}-${index}`} className="flex min-w-0 gap-2">
          <Input
            name={field.key}
            type="url"
            value={url}
            placeholder="https://..."
            className="h-10 min-w-0 flex-1 bg-white text-sm dark:bg-white/[0.03]"
            required={required && index === 0}
            onChange={(event) =>
              setUrls((current) =>
                current.map((item, itemIndex) =>
                  itemIndex === index ? event.target.value : item,
                ),
              )
            }
          />
          {url.trim() ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              aria-label="Buka tautan"
              title="Buka tautan"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
            >
              <ExternalLink className="size-4" />
            </a>
          ) : null}
          <a
            onClick={() =>
              setUrls((current) =>
                current.length > 1
                  ? current.filter((_, itemIndex) => itemIndex !== index)
                  : [""],
              )
            }
            target="_blank"
            rel="noreferrer"
            aria-label="Delete"
            title="Delete"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-slate-200 text-red-600 transition-colors hover:bg-slate-100 hover:text-red-600 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <Trash2 className="size-4" />
          </a>
        </div>
      ))}
      <Button
        className="rounded-xl border-[#C9DCFF] bg-[#F3F7FF] px-4 text-[#1F4BC1] hover:bg-[#E8F0FF] hover:text-[#1F4BC1]"
        type="button"
        variant="outline"
        onClick={() => setUrls((current) => [...current, ""])}
      >
        + Tambah URL
      </Button>
    </div>
  );
}

function getResourceFiles(
  record: ApiRecordDto | null,
  kind: "file" | "url",
): string[] {
  const files = Array.isArray(record?.files)
    ? record.files
        .map((file) =>
          typeof file === "string"
            ? file
            : file && typeof file === "object" && "url" in file
              ? String(file.url ?? "")
              : "",
        )
        .filter(Boolean)
    : [];
  const filePattern =
    /\.(pdf|docx?|xlsx?|pptx?|zip|csv|txt|jpe?g|png|gif|webp|mp4|webm|mov)(?:$|\?)/i;
  return files.filter((file) =>
    kind === "file" ? filePattern.test(file) : !filePattern.test(file),
  );
}

function ColorField({
  field,
  value,
  required,
}: {
  field: ModuleFormField;
  value: string;
  required?: boolean;
}) {
  const [color, setColor] = useState(value);

  return (
    <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-white px-3 dark:bg-white/[0.03]">
      <input
        id={field.key}
        name={field.key}
        type="color"
        value={color}
        required={required}
        onChange={(event) => setColor(event.target.value)}
        className="size-7 shrink-0 cursor-pointer appearance-none rounded-sm border border-slate-300 bg-transparent p-0 shadow-sm [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-[2px]"
      />
      <span className="font-mono text-sm font-medium uppercase text-zinc-500">
        {color}
      </span>
    </div>
  );
}

function getFieldGuidance(field: ModuleFormField) {
  if (field.placeholder || field.helperText)
    return {
      placeholder: field.placeholder ?? "Masukkan data",
      helperText: field.helperText ?? "Masukkan informasi yang sesuai.",
    };

  const fieldGuidance: Record<
    string,
    { placeholder: string; helperText: string }
  > = {
    name: {
      placeholder: "Contoh: SDN Harapan Bangsa",
      helperText: "Masukkan nama sekolah yang valid.",
    },
    title: {
      placeholder: "Contoh: Panduan pembelajaran semester 1",
      helperText: "Gunakan judul singkat yang menjelaskan isi data.",
    },
    email: {
      placeholder: "Contoh: admin@sekolah.id",
      helperText: "Gunakan alamat email yang aktif.",
    },
    phone: {
      placeholder: "Contoh: 0812 3456 7890",
      helperText: "Masukkan nomor yang dapat dihubungi.",
    },
    address: {
      placeholder: "Contoh: Jl. Merdeka No. 10, Jakarta",
      helperText: "Tulis alamat lengkap agar mudah ditemukan.",
    },
    website: {
      placeholder: "Contoh: https://sekolah.id",
      helperText: "Masukkan alamat situs lengkap, termasuk https://.",
    },
    code: {
      placeholder: "Contoh: KLS-10A",
      helperText: "Gunakan kode unik yang mudah dicari.",
    },
    description: {
      placeholder: "Jelaskan secara singkat",
      helperText:
        "Tambahkan keterangan yang membantu orang lain memahami data ini.",
    },
    status: {
      placeholder: "Pilih status",
      helperText:
        "Pilih Aktif jika data masih digunakan, atau Tidak Aktif bila sebaliknya.",
    },
  };

  return (
    fieldGuidance[field.key] ?? {
      placeholder: `Masukkan ${field.label.toLowerCase()}`,
      helperText: `Isi ${field.label.toLowerCase()} sesuai data yang berlaku.`,
    }
  );
}

function toInputValue(value: unknown, type?: ModuleFormField["type"]) {
  if (value === null || value === undefined) return "";
  if (type === "datetime-local") return String(value).slice(0, 16);
  if (type === "file") return "";
  if (type === "color") return String(value || "#2563eb");
  return String(value);
}

function getQuizDateDefaults() {
  const start = new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    duration_minutes: "60",
    start_time: formatLocalDateTime(start),
    end_time: formatLocalDateTime(end),
  };
}

function calculateDurationMinutes(startValue: string, endValue: string) {
  if (!startValue || !endValue) return null;
  const start = new Date(startValue).getTime();
  const end = new Date(endValue).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
    return null;
  return Math.round((end - start) / 60000);
}

function formatDetailDateTime(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatLocalDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toRfc3339(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function normalizeStatus(value: unknown) {
  if (value === true || value === "active" || value === "Aktif")
    return "active";
  if (value === false || value === "inactive" || value === "Tidak Aktif")
    return "inactive";
  return undefined;
}
