import { useCallback, useEffect, useState } from "react";
import { Check, Search, Trash2, UserRoundPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { LearningGroupDetailTable } from "./learning-group-detail-table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/auth/session";
import { createResource, deleteResource } from "@/lib/api/resource";
import type { ApiRecordDto } from "@/lib/dto/api";
import { fetchAvailableGroupMembers } from "../actions";
import { fetchLearningGroupMembers } from "@/pages/learning-group-members/actions";

export function LearningGroupMembersList({ groupId }: { groupId: string }) {
  const [members, setMembers] = useState<ApiRecordDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [candidates, setCandidates] = useState<ApiRecordDto[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<ApiRecordDto | null>(null);
  const [role, setRole] = useState("student");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiRecordDto | null>(null);
  const canViewMembers =
    hasPermission("learning-group-members", "get") ||
    hasPermission("learning-group-members", "get-all");

  const fetchMembers = useCallback(async () => {
    if (!canViewMembers || !groupId) return;
    setLoading(true);
    try {
      const result = await fetchLearningGroupMembers(1, 12, {
        learning_group_id: groupId,
      });
      setMembers(result.items);
      setTotal(result.total);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Anggota grup gagal dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }, [canViewMembers, groupId]);

  useEffect(() => {
    if (!canViewMembers || !groupId) return;
    const task = window.setTimeout(() => void fetchMembers(), 0);
    return () => {
      window.clearTimeout(task);
    };
  }, [canViewMembers, fetchMembers, groupId]);

  useEffect(() => {
    if (!addOpen) return;
    const task = window.setTimeout(
      () => {
        void fetchAvailableGroupMembers(1, 5, {
          ...(role === "student"
            ? { "u.type": "student" }
            : { "u.type.in": "teacher,admin" }),
          ...(search ? { search } : {}),
        })
          .then((result) => setCandidates(result.items))
          .catch(() => setCandidates([]));
      },
      search ? 300 : 0,
    );
    return () => window.clearTimeout(task);
  }, [addOpen, role, search]);

  if (!canViewMembers) return null;

  const canCreateMember = hasPermission("learning-group-members", "create");
  const canDeleteMember = hasPermission("learning-group-members", "delete");
  const addMember = async () => {
    if (!selectedUser?.id) {
      toast.error("Pilih pengguna yang akan ditambahkan.");
      return;
    }
    setSaving(true);
    try {
      await createResource("/learning-group-members", {
        user_id: selectedUser.id,
        learning_group_id: groupId,
        role_in_group: role,
      });
      toast.success("Anggota grup berhasil ditambahkan.");
      setAddOpen(false);
      setSearch("");
      setSelectedUser(null);
      await fetchMembers();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Anggota grup gagal ditambahkan.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = async () => {
    if (!deleteTarget?.id) return;
    setSaving(true);
    try {
      await deleteResource("/learning-group-members", deleteTarget.id);
      toast.success("Anggota grup berhasil dihapus.");
      setDeleteTarget(null);
      await fetchMembers();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Anggota grup gagal dihapus.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="border-t border-slate-100 pt-6 dark:border-white/10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
            <Users className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Anggota Grup</h3>
            <p className="text-xs text-zinc-500">
              {loading ? "Memuat anggota..." : `${total} anggota terdaftar`}
            </p>
          </div>
        </div>
        {canCreateMember ? (
          <Button
            className="p-4 bg-blue-500 hover:bg-blue-600 text-white"
            size="sm"
            onClick={() => setAddOpen(true)}
          >
            <UserRoundPlus /> Tambah Anggota
          </Button>
        ) : null}
      </div>
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-white/10"
            />
          ))}
        </div>
      ) : members.length ? (
        <LearningGroupDetailTable
          headers={[
            "Nama",
            "Email",
            "Peran",
            ...(canDeleteMember ? ["Aksi"] : []),
          ]}
          rightAlignedLastColumn={canDeleteMember}
        >
          {members.map((member) => (
            <TableRow key={String(member.id)}>
              <TableCell className="px-4 py-3 font-medium">
                {String(member.user_name ?? member.name ?? "-")}
              </TableCell>
              <TableCell className="px-4 py-3 text-zinc-500">
                {String(member.user_email ?? member.email ?? "-")}
              </TableCell>
              <TableCell className="px-4 py-3">
                <Badge
                  className={
                    member.role_in_group === "instructor"
                      ? "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-900"
                      : "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-900"
                  }
                >
                  {member.role_in_group === "instructor"
                    ? "Guru"
                    : member.role_in_group === "student"
                      ? "Siswa"
                      : String(member.role_in_group ?? "-")}
                </Badge>
              </TableCell>
              {canDeleteMember ? (
                <TableCell className="px-4 py-2 text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                    aria-label="Hapus anggota"
                    onClick={() => setDeleteTarget(member)}
                  >
                    <Trash2 />
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </LearningGroupDetailTable>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-xs text-zinc-500 dark:border-white/15">
          Belum ada anggota pada grup ini.
        </div>
      )}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-xl sm:max-w-xl">
          <div className="pr-6">
            <h3 className="text-base font-semibold">Tambah Anggota Grup</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Cari lalu pilih pengguna yang akan dimasukkan ke grup ini.
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label>Peran dalam grup</Label>
            <Select
              value={role === "student" ? "Siswa" : "Pengajar"}
              onValueChange={(label) => {
                setRole(label === "Pengajar" ? "instructor" : "student");
                setSelectedUser(null);
              }}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Siswa">Siswa</SelectItem>
                <SelectItem value="Pengajar">Pengajar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="member-search">Cari pengguna</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                id="member-search"
                className="h-9 pl-9"
                placeholder="Nama atau email pengguna"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSelectedUser(null);
                }}
              />
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 p-1 dark:border-white/10">
              {candidates.length ? (
                candidates.map((user) => {
                  const isSelected = selectedUser?.id === user.id;
                  return (
                    <Button
                      key={String(user.id)}
                      type="button"
                      variant="ghost"
                      className={`h-auto w-full justify-start px-3 py-2 text-left ${isSelected ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30" : ""}`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium">
                          {String(user.name ?? "Tanpa nama")}
                        </span>
                        <span className="block truncate text-[11px] text-zinc-500">
                          {String(user.email ?? "-")}
                        </span>
                      </span>
                      {isSelected ? <Check className="size-4" /> : null}
                    </Button>
                  );
                })
              ) : (
                <p className="px-3 py-4 text-center text-xs text-zinc-500">
                  Pengguna tidak ditemukan.
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              className="p-4"
              variant="outline"
              onClick={() => setAddOpen(false)}
            >
              Batal
            </Button>
            <Button
              className="p-4"
              disabled={saving || !selectedUser}
              onClick={() => void addMember()}
            >
              {saving ? "Menambahkan..." : "Tambah Anggota"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="w-[calc(100%-1rem)] max-w-lg gap-5 px-6 py-5 sm:max-w-lg sm:px-6">
          <h2 className="text-lg font-semibold">Hapus permanen Anggota Grup</h2>
          <p className="text-sm text-zinc-500 mt-[-10px] mb-3">
            Hapus{" "}
            {String(
              deleteTarget?.user_name ?? deleteTarget?.name ?? "anggota ini",
            )}{" "}
            dari grup? Tindakan ini tidak dapat dipulihkan.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              className="p-4"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Batal
            </Button>
            <Button
              className="p-4 bg-red-600 text-white hover:bg-red-700"
              disabled={saving}
              onClick={() => void deleteMember()}
            >
              {saving ? "Menghapus..." : "Hapus permanen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
