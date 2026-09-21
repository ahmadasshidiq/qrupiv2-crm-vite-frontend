import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DynamicPage, {
  type DefaultColumnFormat,
} from "@/components/dynamic-page";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchDropdown } from "@/components/search-dropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import type { ApiRecordDto } from "@/lib/dto/api";
import type { PaginatedResult, PaginationFilters } from "@/lib/api/paginated";
import {
  Archive,
  ArrowLeft,
  Download,
  Eye,
  Funnel,
  Plus,
  SquarePen,
  RotateCcw,
  Trash2,
  Upload,
  School,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { archiveResource, deleteResource } from "@/lib/api/resource";
import { getAuthUser, getRoleName, hasPermission } from "@/lib/auth/session";
import { getModuleBehavior } from "@/lib/module-behaviors";
import { toast } from "sonner";

const periodTypeLabels: Record<string, string> = {
  daily: "Hari",
  weekly: "Minggu",
  monthly: "Bulan",
  yearly: "Tahun",
};

export type BackendModuleConfig = {
  endpoint?: string;
  model?: string;
  behaviorKey?: string;
  title: string;
  description: string;
  emptyMessage: string;
  fields: DefaultColumnFormat<ApiRecordDto>[];
  actions?: Partial<Record<ModuleAction, boolean>>;
  filterFields?: FilterField[];
  toolbarActions?: Array<{
    label: string;
    href: string;
    icon?: LucideIcon;
    className?: string;
  }>;
  headerAction?: {
    label: string;
    icon?: LucideIcon;
    href?: string;
  };
  backHref?: string;
  backLabel?: string;
  display?: "table" | "cards";
  detailRenderer?: (record: ApiRecordDto) => ReactNode;
  renderRowActions?: (record: ApiRecordDto) => ReactNode;
  editableFields?: ModuleFormField[];
  multipart?: boolean;
  createEndpoint?: string;
  createPayload?: (values: Record<string, unknown>) => Record<string, unknown>;
  updatePayload?: (values: Record<string, unknown>) => Record<string, unknown>;
};

export type ModuleAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "archive"
  | "filter"
  | "import"
  | "export";

export type FilterField = {
  key: string;
  label: string;
  type: "text" | "select";
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
};

export type ModuleFormField = {
  key: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "number"
    | "boolean"
    | "color"
    | "password"
    | "datetime-local"
    | "textarea"
    | "file"
    | "file-multi"
    | "url-multi"
    | "region"
    | "role"
    | "activity-category"
    | "resource"
    | "resource-multi"
    | "learning-groups"
    | "quiz-questions"
    | "h5p-editor"
    | "hidden";
  placeholder?: string;
  helperText?: string;
  fullWidth?: boolean;
  accept?: string;
  required?: boolean;
  visibleWhen?: { key: string; values: string[] };
  requiredWhen?: { key: string; values: string[] };
  options?: Array<{ label: string; value: string }>;
  resourceEndpoint?: string;
  resourceFilters?: PaginationFilters;
  resourcePlaceholder?: string;
  regionLevel?: import("@/lib/api/regions").RegionLevel;
};

type DefaultModulePageProps = {
  config: BackendModuleConfig;
  fetchPage: (
    page: number,
    limit: number,
    filters?: PaginationFilters,
  ) => Promise<PaginatedResult<ApiRecordDto>>;
  onToolbarAction?: (action: {
    label: string;
    href: string;
    icon?: LucideIcon;
  }) => boolean;
  onHeaderAction?: () => void;
  onExport?: () => void;
};

const ITEMS_PER_PAGE = 12;

function readNestedValue(record: ApiRecordDto, path: string) {
  return path.split(".").reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[key];
  }, record);
}

function ModuleFilterPanel({
  title,
  values,
  showStatus,
  filterFields,
  onChange,
  onApply,
  onClear,
  items,
  fetchSuggestions,
}: {
  title: string;
  values: PaginationFilters;
  showStatus: boolean;
  filterFields?: FilterField[];
  onChange: (key: string, value: string) => void;
  onApply: () => void;
  onClear: () => void;
  items: ApiRecordDto[];
  fetchSuggestions: (query: string) => Promise<ApiRecordDto[]>;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Filter {title}</h3>
        <Button
          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
        >
          <RotateCcw className="h-4 w-4" /> Reset Filter
        </Button>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        {filterFields?.map((field) =>
          field.type === "text" ? (
            <div key={field.key} className="grid gap-1.5">
              <Label>{field.label}</Label>
              <SearchDropdown
                className="!h-8 w-auto"
                items={items}
                value={String(values[field.key] ?? "")}
                placeholder={
                  field.placeholder ?? `Cari ${field.label.toLowerCase()}...`
                }
                getLabel={(item) =>
                  String(
                    item.name ?? item.title ?? item.code ?? item.id ?? "Data",
                  )
                }
                onChange={(value) => onChange(field.key, value)}
                fetchMatches={fetchSuggestions}
              />
            </div>
          ) : (
            <div key={field.key} className="grid gap-1.5">
              <Label>{field.label}</Label>
              <Select
                value={
                  field.options?.find(
                    (option) => option.value === values[field.key],
                  )?.label ?? `Semua ${field.label}`
                }
                onValueChange={(label) =>
                  onChange(
                    field.key,
                    field.options?.find((option) => option.label === label)
                      ?.value ?? "",
                  )
                }
              >
                <SelectTrigger className="!h-8 w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={`Semua ${field.label}`}>
                    Semua {field.label}
                  </SelectItem>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.label}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ),
        )}
        {!filterFields ? (
          <div className="grid gap-1.5">
            <Label htmlFor="filter-search">Cari</Label>
            <SearchDropdown
              className="!h-8 w-60"
              items={items}
              value={String(values.search ?? "")}
              placeholder={`Cari ${title.toLowerCase()}...`}
              getLabel={(item) =>
                String(
                  item.name ?? item.title ?? item.code ?? item.id ?? "Data",
                )
              }
              onChange={(value) => onChange("search", value)}
              fetchMatches={fetchSuggestions}
            />
          </div>
        ) : null}
        {!filterFields && showStatus ? (
          <div className="grid gap-1.5">
            <Label>Status</Label>
            <Select
              value={
                values.status === "active"
                  ? "Aktif"
                  : values.status === "inactive"
                    ? "Tidak Aktif"
                    : "Semua status"
              }
              onValueChange={(label) =>
                onChange(
                  "status",
                  label === "Aktif"
                    ? "active"
                    : label === "Tidak Aktif"
                      ? "inactive"
                      : "",
                )
              }
            >
              <SelectTrigger className="!h-8 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua status">Semua status</SelectItem>
                <SelectItem value="Aktif">Aktif</SelectItem>
                <SelectItem value="Tidak Aktif">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <Button
          className="p-4 bg-blue-600 text-white hover:bg-blue-700"
          type="button"
          onClick={onApply}
        >
          Terapkan Filter
        </Button>
      </div>
    </div>
  );
}

export function DefaultModulePage({
  config,
  fetchPage,
  onToolbarAction,
  onHeaderAction,
  onExport,
}: DefaultModulePageProps) {
  const behavior = getModuleBehavior(config);
  const location = useLocation();
  const navigate = useNavigate();
  const model = behavior.endpoint.slice(1);
  const isSuperAdmin = getRoleName(getAuthUser()) === "super_admin";
  const canShowAction = (action: ModuleAction) =>
    config.actions?.[action] ?? action !== "delete";
  const hasAnyPermission = (actions: string[]) =>
    actions.some((action) => hasPermission(model, action));
  const canView = canShowAction("view") && hasAnyPermission(["get-by-id"]);
  const canCreate = canShowAction("create") && hasAnyPermission(["create"]);
  const canEdit = canShowAction("edit") && hasAnyPermission(["update"]);
  const canArchive = canShowAction("archive") && hasAnyPermission(["archive"]);
  const canDelete = canShowAction("delete") && hasAnyPermission(["delete"]);
  const canFilter =
    canShowAction("filter") && hasAnyPermission(["get", "get-all"]);
  const canImport =
    canShowAction("import") && hasAnyPermission(["import", "create"]);
  const canExport =
    canShowAction("export") && hasAnyPermission(["export", "get", "get-all"]);
  const [items, setItems] = useState<ApiRecordDto[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<PaginationFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<PaginationFilters>({});
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<ApiRecordDto | null>(
    null,
  );
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchPage(
        currentPage,
        ITEMS_PER_PAGE,
        appliedFilters,
      );
      setItems(result.items);
      setTotal(result.total);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Data gagal dimuat.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, currentPage, fetchPage]);

  useEffect(() => {
    const task = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(task);
  }, [fetchData]);

  const columns = useMemo<DefaultColumnFormat<ApiRecordDto>[]>(
    () =>
      config.fields
        .filter((field) => isSuperAdmin || field.key !== "institution_name")
        .map((field) => ({
          ...field,
          formatter: (_value, record) => {
            const value = readNestedValue(record, field.key);
            if (field.formatter) return field.formatter(value, record);
            if (value === null || value === undefined || value === "")
              return "-";
            if (field.type === "date")
              return new Date(String(value)).toLocaleString("id-ID");
            if (typeof value === "boolean") return value ? "Ya" : "Tidak";
            return String(value);
          },
        })),
    [config.fields, isSuperAdmin],
  );

  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8 lg:px-10">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {config.backHref ? (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 mb-2"
              onClick={() => navigate(config.backHref!)}
            >
              <ArrowLeft className="size-4" /> {config.backLabel ?? "Kembali"}
            </Button>
          ) : null}
          <h2 className="text-xl font-bold tracking-tight">{config.title}</h2>
          <p className="mt-1 text-xs text-zinc-500">{config.description}</p>
        </div>
        {config.headerAction && (onHeaderAction || config.headerAction.href) ? (
          <Button
            className="h-10 px-4"
            variant="outline"
            onClick={() => {
              if (onHeaderAction) {
                onHeaderAction();
                return;
              }

              if (config.headerAction?.href) navigate(config.headerAction.href);
            }}
          >
            {config.headerAction.icon ? (
              <config.headerAction.icon className="size-4" />
            ) : null}
            {config.headerAction.label}
          </Button>
        ) : null}
      </div>
      <DynamicPage
        toolbar={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {config.toolbarActions?.map((action) => (
                <Button
                  className={`p-4 ${action.className ?? ""}`}
                  key={action.href}
                  variant="outline"
                  onClick={() => {
                    if (!onToolbarAction?.(action)) navigate(action.href);
                  }}
                >
                  {action.icon ? <action.icon className="size-4" /> : null}
                  {action.label}
                </Button>
              ))}
              {canCreate ? (
                <Button
                  className="p-4 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                  onClick={() =>
                    navigate(`${location.pathname}/create${location.search}`)
                  }
                >
                  <Plus /> Tambah {config.title}
                </Button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {canImport ? (
                <Button
                  className="p-4 border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100 hover:text-blue-800 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-950/50"
                  type="button"
                  variant="outline"
                >
                  <Upload /> Import
                </Button>
              ) : null}
              {canExport ? (
                <Button
                  className="p-4 border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
                  type="button"
                  variant="outline"
                  onClick={onExport}
                >
                  <Download /> Export Excel
                </Button>
              ) : null}
              {canFilter ? (
                <Button
                  className="p-4 border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-200 hover:text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                  type="button"
                  variant="outline"
                  onClick={() => setFilterOpen((open) => !open)}
                >
                  <Funnel /> Filter
                </Button>
              ) : null}
            </div>
          </div>
        }
        filterPanel={
          filterOpen ? (
            <ModuleFilterPanel
              title={config.title}
              values={draftFilters}
              showStatus={config.fields.some((field) => field.key === "status")}
              filterFields={config.filterFields}
              onChange={(key, value) =>
                setDraftFilters((filters) => ({ ...filters, [key]: value }))
              }
              onApply={() => {
                setCurrentPage(1);
                setAppliedFilters(draftFilters);
              }}
              onClear={() => {
                setDraftFilters({});
                setCurrentPage(1);
                setAppliedFilters({});
              }}
              items={items}
              fetchSuggestions={async (query) =>
                (await fetchPage(1, 5, { search: query })).items
              }
            />
          ) : null
        }
        columns={columns}
        items={items}
        total={total}
        currentPage={currentPage}
        totalPages={Math.max(1, Math.ceil(total / ITEMS_PER_PAGE))}
        loading={loading}
        emptyMessage={config.emptyMessage}
        cardRenderer={
          config.display === "cards"
            ? (records) => (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {records.map((record, index) => {
                    const accent = String(
                      record.color || record.category_color || "#2563eb",
                    );
                    const title = String(
                      record.name ?? record.title ?? "Tanpa nama",
                    );
                    const description = String(
                      record.description ?? "Belum ada deskripsi.",
                    );
                    const categoryName = record.category_name
                      ? String(record.category_name)
                      : null;
                    const institutionName = isSuperAdmin
                      ? String(
                          record.institution_name ??
                            (record.institution as ApiRecordDto | undefined)
                              ?.name ??
                            "",
                        )
                      : "";
                    return (
                      <article
                        key={String(record.id ?? index)}
                        className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]"
                      >
                        <span
                          className="absolute inset-y-0 left-0 w-2"
                          style={{ backgroundColor: accent }}
                        />
                        <div className="pl-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate font-semibold">
                                {title}
                              </h3>
                              {institutionName ? (
                                <span className="mt-2 flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                  <School className="size-3 text-slate-400" />
                                  {institutionName}
                                </span>
                              ) : null}
                              {categoryName ? (
                                <span
                                  className="mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-medium text-white"
                                  style={{
                                    backgroundColor: String(
                                      record.category_color || accent,
                                    ),
                                  }}
                                >
                                  {categoryName}
                                </span>
                              ) : null}
                              <p className="mt-2 line-clamp-2 text-xs text-zinc-500">
                                {description}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <span
                                className="size-5 rounded-full border border-white shadow-sm"
                                style={{ backgroundColor: accent }}
                              />
                              {record.type ? (
                                <span
                                  className={`rounded-full px-2 py-1 text-[10px] font-medium whitespace-nowrap ${record.type === "positive" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"}`}
                                >
                                  {record.type === "positive"
                                    ? "Aktivitas positif"
                                    : "Pelanggaran"}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="mt-4 grid gap-2 pt-1 text-xs">
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                              {record.point_value !== null &&
                              record.point_value !== undefined ? (
                                <div className="rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-white/[0.04]">
                                  <span className="block text-[10px] text-zinc-400">
                                    Poin
                                  </span>
                                  <span className="mt-0.5 block font-medium text-slate-700 dark:text-slate-200">
                                    {String(record.point_value)}
                                  </span>
                                </div>
                              ) : null}
                              {record.daily_limit ? (
                                <div className="rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-white/[0.04]">
                                  <span className="block text-[10px] text-zinc-400">
                                    Limit harian
                                  </span>
                                  <span className="mt-0.5 block font-medium text-slate-700 dark:text-slate-200">
                                    {String(record.daily_limit)} Kali
                                  </span>
                                </div>
                              ) : null}
                              {record.period_type &&
                              record.period_type !== "none" ? (
                                <div className="rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-white/[0.04]">
                                  <span className="block text-[10px] text-zinc-400">
                                    Batas per{" "}
                                    {periodTypeLabels[
                                      String(record.period_type)
                                    ] ?? String(record.period_type)}
                                  </span>
                                  <span className="mt-0.5 block font-medium text-slate-700 dark:text-slate-200">
                                    {record.period_limit
                                      ? `${String(record.period_limit)} kali`
                                      : "Tanpa batas"}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-[10px] text-zinc-400">
                              {record.is_send_notif
                                ? "Notifikasi aktif"
                                : "Notifikasi nonaktif"}
                            </span>
                            <div className="flex gap-1">
                              {canView ? (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-blue-600"
                                  onClick={() =>
                                    navigate(
                                      `${location.pathname}/${record.id}/view`,
                                    )
                                  }
                                >
                                  <Eye />
                                </Button>
                              ) : null}
                              {canEdit ? (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-violet-600"
                                  onClick={() =>
                                    navigate(
                                      `${location.pathname}/${record.id}/edit`,
                                    )
                                  }
                                >
                                  <SquarePen />
                                </Button>
                              ) : null}
                              {canArchive ? (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-amber-600"
                                  onClick={() => {
                                    setSelectedRecord(record);
                                    setArchiveOpen(true);
                                  }}
                                >
                                  <Archive />
                                </Button>
                              ) : null}
                              {canDelete ? (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-red-600"
                                  aria-label="Hapus permanen"
                                  onClick={() => {
                                    setSelectedRecord(record);
                                    setDeleteOpen(true);
                                  }}
                                >
                                  <Trash2 />
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )
            : undefined
        }
        onPageChange={setCurrentPage}
        getRowId={(record, index) => String(record.id ?? index)}
        renderActions={(record) => (
          <div className="flex justify-end gap-1.5">
            {config.renderRowActions?.(record)}
            {canView ? (
              <Button
                variant="ghost"
                size="icon"
                className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
                aria-label="Lihat detail"
                onClick={() =>
                  navigate(`${location.pathname}/${record.id}/view`)
                }
              >
                <Eye className="size-3.5" />
              </Button>
            ) : null}
            {canEdit ? (
              <Button
                variant="ghost"
                size="icon"
                className="text-violet-600 hover:bg-violet-50 hover:text-violet-700 dark:text-violet-400 dark:hover:bg-violet-950/40"
                aria-label="Edit data"
                onClick={() =>
                  navigate(`${location.pathname}/${record.id}/edit`)
                }
              >
                <SquarePen className="size-3.5" />
              </Button>
            ) : null}
            {canArchive ? (
              <Button
                variant="ghost"
                size="icon"
                className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/40"
                aria-label="Arsipkan data"
                onClick={() => {
                  setSelectedRecord(record);
                  setArchiveOpen(true);
                }}
              >
                <Archive className="size-3.5" />
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                variant="ghost"
                size="icon"
                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                aria-label="Hapus permanen"
                onClick={() => {
                  setSelectedRecord(record);
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            ) : null}
          </div>
        )}
      />
      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-lg gap-5 px-6 py-5 sm:max-w-lg sm:px-6">
          <h2 className="text-lg font-semibold">Arsipkan {config.title}</h2>
          <p className="text-sm text-zinc-500 mt-[-10px] mb-3">
            Data akan disembunyikan dari daftar aktif dan dapat dipulihkan
            melalui Ruang Arsip.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              className="p-4"
              variant="outline"
              onClick={() => setArchiveOpen(false)}
            >
              Batal
            </Button>
            <Button
              className="p-4 bg-amber-600 text-white hover:bg-amber-700"
              disabled={saving}
              onClick={() => void confirmArchive()}
            >
              {saving ? "Mengarsipkan..." : "Arsipkan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-lg gap-5 px-6 py-5 sm:max-w-lg sm:px-6">
          <h2 className="text-lg font-semibold">
            Hapus permanen {config.title}
          </h2>
          <p className="text-sm text-zinc-500 mt-[-10px] mb-3">
            Data akan dihapus permanen dan tidak dapat dipulihkan.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              className="p-4"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
            >
              Batal
            </Button>
            <Button
              className="p-4 bg-red-600 text-white hover:bg-red-700"
              disabled={saving}
              onClick={() => void confirmDelete()}
            >
              {saving ? "Menghapus..." : "Hapus permanen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );

  async function confirmArchive() {
    if (!selectedRecord?.id) return;
    setSaving(true);
    try {
      await archiveResource(behavior.endpoint, selectedRecord.id);
      setArchiveOpen(false);
      toast.success(`${config.title} berhasil diarsipkan.`);
      await fetchData();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Data gagal diarsipkan.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!selectedRecord?.id) return;
    setSaving(true);
    try {
      await deleteResource(behavior.endpoint, selectedRecord.id);
      setDeleteOpen(false);
      toast.success(`${config.title} berhasil dihapus permanen.`);
      await fetchData();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Data gagal dihapus permanen.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }
}
