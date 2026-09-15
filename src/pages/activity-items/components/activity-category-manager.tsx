import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  ArrowLeft,
  ExternalLink,
  Plus,
  SquarePen,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import {
  archiveResource,
  createResource,
  deleteResource,
  updateResource,
} from "@/lib/api/resource";
import { hasPermission } from "@/lib/auth/session";
import type { ApiRecordDto } from "@/lib/dto/api";
import { fetchActivityCategories } from "../../activity-categories/actions";

type CategoryForm = { name: string; description: string; color: string };

const EMPTY_FORM: CategoryForm = {
  name: "",
  description: "",
  color: "#2563eb",
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function ActivityCategoryManager({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ApiRecordDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ApiRecordDto | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [archiveTarget, setArchiveTarget] = useState<ApiRecordDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiRecordDto | null>(null);

  const canCreate = hasPermission("activity-categories", "create");
  const canEdit = hasPermission("activity-categories", "update");
  const canArchive = hasPermission("activity-categories", "archive");
  const canDelete = hasPermission("activity-categories", "delete");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchActivityCategories(1, 50);
      setCategories(result.items);
    } catch (error) {
      toast.error(getErrorMessage(error, "Kategori aktivitas gagal dimuat."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const task = window.setTimeout(() => void fetchCategories(), 0);
    return () => window.clearTimeout(task);
  }, [fetchCategories, open]);

  const closeForm = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const openCreateForm = () => {
    setEditing({});
    setForm(EMPTY_FORM);
  };

  const openEditForm = (category: ApiRecordDto) => {
    setEditing(category);
    setForm({
      name: String(category.name ?? ""),
      description: String(category.description ?? ""),
      color: String(category.color || "#2563eb"),
    });
  };

  const saveCategory = async () => {
    if (!form.name.trim()) {
      toast.error("Nama kategori wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      if (editing?.id) {
        await updateResource("/activity-categories", editing.id, form);
        toast.success("Kategori aktivitas berhasil diperbarui.");
      } else {
        await createResource("/activity-categories", form);
        toast.success("Kategori aktivitas berhasil ditambahkan.");
      }
      closeForm();
      await fetchCategories();
    } catch (error) {
      toast.error(getErrorMessage(error, "Kategori aktivitas gagal disimpan."));
    } finally {
      setSaving(false);
    }
  };

  const archiveCategory = async () => {
    if (!archiveTarget?.id) return;
    setSaving(true);
    try {
      await archiveResource("/activity-categories", archiveTarget.id);
      toast.success("Kategori aktivitas berhasil diarsipkan.");
      setArchiveTarget(null);
      await fetchCategories();
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Kategori aktivitas gagal diarsipkan."),
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async () => {
    if (!deleteTarget?.id) return;
    setSaving(true);
    try {
      await deleteResource("/activity-categories", deleteTarget.id);
      toast.success("Kategori aktivitas berhasil dihapus permanen.");
      setDeleteTarget(null);
      await fetchCategories();
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Kategori aktivitas gagal dihapus permanen."),
      );
    } finally {
      setSaving(false);
    }
  };

  const isFormOpen = editing !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(760px,calc(100vh-3rem))] w-[calc(100%-3rem)] max-w-4xl gap-0 overflow-y-auto p-0 sm:max-w-4xl">
        <div className="border-b border-slate-200 px-4 py-3 dark:border-white/10 sm:px-5">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div>
              <h2 className="text-base font-semibold">
                Kelola Kategori Aktivitas
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Atur kategori tanpa meninggalkan daftar jenis aktivitas.
              </p>
            </div>
          </div>
        </div>

        {isFormOpen ? (
          <div className="space-y-3 p-4 sm:p-5">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2"
              onClick={closeForm}
            >
              <ArrowLeft className="size-4" /> Kembali ke kategori
            </Button>
            <div>
              <h3 className="font-semibold">
                {editing?.id ? "Ubah Kategori" : "Tambah Kategori"}
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                Nama dan warna kategori akan tampil pada setiap jenis aktivitas
                terkait.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="grid gap-1.5">
                <Label htmlFor="category-name">Nama kategori</Label>
                <Input
                  id="category-name"
                  className="h-9 text-sm"
                  placeholder="Contoh: 7 Kebiasaan Anak Indonesia Hebat"
                  value={form.name}
                  onChange={(event) =>
                    setForm((value) => ({ ...value, name: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="category-color">Warna</Label>
                <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-input/20 px-2">
                  <Input
                    id="category-color"
                    type="color"
                    className="h-6 w-7 border-0 bg-transparent p-0"
                    value={form.color}
                    onChange={(event) =>
                      setForm((value) => ({
                        ...value,
                        color: event.target.value,
                      }))
                    }
                  />
                  <span className="text-xs text-zinc-500">
                    {form.color.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="category-description">Deskripsi</Label>
              <Textarea
                id="category-description"
                placeholder="Jelaskan tujuan atau cakupan kategori ini."
                value={form.description}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-white/10">
              <Button className="p-4" variant="outline" onClick={closeForm}>
                Batal
              </Button>
              <Button
                className="p-4"
                disabled={saving}
                onClick={() => void saveCategory()}
              >
                {saving ? "Menyimpan..." : "Simpan Kategori"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              {canCreate ? (
                <Button
                  className="p-4 bg-blue-600 text-white hover:bg-blue-700"
                  onClick={openCreateForm}
                >
                  <Plus /> Tambah Kategori
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-zinc-500"
                onClick={() => navigate("/activity-categories")}
              >
                Halaman penuh <ExternalLink className="size-3.5" />
              </Button>
            </div>
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-28 animate-pulse rounded-xl bg-slate-100 dark:bg-white/10"
                  />
                ))}
              </div>
            ) : categories.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {categories.map((category) => {
                  const color = String(category.color || "#2563eb");
                  return (
                    <article
                      key={String(category.id)}
                      className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]"
                    >
                      <span
                        className="absolute inset-y-0 left-0 w-2"
                        style={{ backgroundColor: color }}
                      />
                      <div className="pl-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold">
                              {String(category.name ?? "Tanpa nama")}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                              {String(
                                category.description ?? "Belum ada deskripsi.",
                              )}
                            </p>
                          </div>
                          <span
                            className="size-5 shrink-0 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                        </div>
                        <div className="mt-3 flex justify-end gap-1">
                          {canEdit ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-violet-600"
                              onClick={() => openEditForm(category)}
                            >
                              <SquarePen />
                            </Button>
                          ) : null}
                          {canArchive ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-amber-600"
                              onClick={() => setArchiveTarget(category)}
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
                              onClick={() => setDeleteTarget(category)}
                            >
                              <Trash2 />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-white/15">
                Belum ada kategori aktivitas.
              </div>
            )}
          </div>
        )}

        {archiveTarget || deleteTarget ? (
          <div
            className={`flex items-center justify-between gap-4 border-t border-slate-200 px-5 py-3 dark:border-white/10 sm:px-6 ${deleteTarget ? "bg-red-50 dark:bg-red-950/20" : "bg-amber-50 dark:bg-amber-950/20"}`}
          >
            <p
              className={`text-xs ${deleteTarget ? "text-red-800 dark:text-red-200" : "text-amber-800 dark:text-amber-200"}`}
            >
              {deleteTarget
                ? `Hapus permanen kategori “${String(deleteTarget.name)}”? Data tidak dapat dipulihkan.`
                : `Arsipkan kategori “${String(archiveTarget?.name)}”?`}
            </p>
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setArchiveTarget(null);
                  setDeleteTarget(null);
                }}
              >
                Batal
              </Button>
              <Button
                size="sm"
                variant={deleteTarget ? "destructive" : "default"}
                disabled={saving}
                onClick={() =>
                  void (deleteTarget ? deleteCategory() : archiveCategory())
                }
              >
                {saving
                  ? deleteTarget
                    ? "Menghapus..."
                    : "Mengarsipkan..."
                  : deleteTarget
                    ? "Hapus permanen"
                    : "Arsipkan"}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
