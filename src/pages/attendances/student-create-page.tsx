import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CircleHelp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api/client";
import { fetchPaginated } from "@/lib/api/paginated";
import type { ApiRecordDto } from "@/lib/dto/api";

type StudentStatus = "on_time" | "late" | "absent";
type StudentState = { status: StudentStatus; reasonId: string | null };

const statusLabels: Record<StudentStatus, string> = {
  on_time: "Hadir",
  late: "Terlambat",
  absent: "Tidak hadir",
};
const getGroupLabel = (group: ApiRecordDto) => {
  const nestedGroup = group.learning_group as ApiRecordDto | undefined;
  return String(
    group.name ??
      group.learning_group_name ??
      group.group_name ??
      group.display_name ??
      group.title ??
      group.code ??
      nestedGroup?.name ??
      nestedGroup?.learning_group_name ??
      "Grup",
  );
};

const getReasonLabel = (reason: ApiRecordDto) =>
  String(
    reason.name ??
      reason.reason ??
      reason.absence_reason_name ??
      reason.label ??
      reason.title ??
      reason.description ??
      "Alasan",
  );

export default function StudentAttendanceCreatePage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<ApiRecordDto[]>([]);
  const [students, setStudents] = useState<ApiRecordDto[]>([]);
  const [reasons, setReasons] = useState<ApiRecordDto[]>([]);
  const [groupId, setGroupId] = useState<string | null>("");
  const [states, setStates] = useState<Record<string, StudentState>>({});
  const [checkInAt, setCheckInAt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetchPaginated<ApiRecordDto>("/learning-groups", 1, 500),
      fetchPaginated<ApiRecordDto>("/attendance-absence-reasons", 1, 500),
    ])
      .then(([groupResult, reasonResult]) => {
        setGroups(groupResult.items);
        setReasons(reasonResult.items);
      })
      .catch(() => toast.error("Data grup atau alasan gagal dimuat."));
  }, []);

  useEffect(() => {
    const load = groupId
      ? fetchPaginated<ApiRecordDto>("/learning-group-members", 1, 500, {
          learning_group_id: groupId,
        })
      : fetchPaginated<ApiRecordDto>("/users", 1, 500, { "u.type": "student" });
    void load
      .then((result) => {
        const items = groupId
          ? result.items.map((item) => {
              const user = item.user as ApiRecordDto | undefined;
              return {
                ...item,
                id: String(item.user_id ?? user?.id ?? item.id),
                name: String(
                  item.user_name ?? user?.name ?? item.name ?? "Siswa",
                ),
                email: String(item.user_email ?? user?.email ?? ""),
              };
            })
          : result.items;
        setStudents(items);
        setStates((current) =>
          Object.fromEntries(
            items.map((student) => {
              const id = String(student.id);
              return [id, current[id] ?? { status: "on_time", reasonId: "" }];
            }),
          ),
        );
      })
      .catch(() => {
        setStudents([]);
        setStates({});
      });
  }, [groupId]);

  const selectedCount = students.length;
  const absentWithoutReason = students.some(
    (student) =>
      states[String(student.id)]?.status === "absent" &&
      !states[String(student.id)]?.reasonId,
  );
  const allStatus = useMemo(
    () =>
      students.every(
        (student) => states[String(student.id)]?.status === "on_time",
      ),
    [states, students],
  );

  function updateStatus(id: string, status: StudentStatus) {
    setStates((current) => ({
      ...current,
      [id]: {
        status,
        reasonId: status === "absent" ? (current[id]?.reasonId ?? "") : "",
      },
    }));
  }
  function selectAll(status: StudentStatus) {
    setStates(
      Object.fromEntries(
        students.map((student) => [
          String(student.id),
          { status, reasonId: "" },
        ]),
      ),
    );
  }
  async function submit() {
    if (!students.length)
      return toast.error("Belum ada siswa yang dapat dicatat.");
    if (absentWithoutReason)
      return toast.error("Pilih alasan untuk setiap siswa yang tidak hadir.");
    if (!checkInAt && !allStatus)
      return toast.error("Isi waktu absensi terlebih dahulu.");
    let location = { latitude: 0, longitude: 0 };
    if (students.some((student) => states[String(student.id)]?.status !== "absent")) {
      if (!navigator.geolocation)
        return toast.error("Browser tidak mendukung pengambilan lokasi.");
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }),
        );
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } catch {
        return toast.error("Izin lokasi diperlukan untuk menyimpan koordinat absensi.");
      }
    }
    setSaving(true);
    try {
      await apiRequest("/attendance-logs/bulk", {
        method: "POST",
        body: {
          attendance_logs: students.map((student) => {
            const state = states[String(student.id)];
            return {
              user_id: String(student.id),
              learning_group_id: groupId || undefined,
              check_in_at:
                state.status === "absent"
                  ? undefined
                  : new Date(checkInAt).toISOString(),
              status: state.status,
              absence_reason_id:
                state.status === "absent" ? state.reasonId : undefined,
              type: "student",
              requires_check_out: false,
              check_in_lat:
                state.status === "absent" ? undefined : location.latitude,
              check_in_long:
                state.status === "absent" ? undefined : location.longitude,
            };
          }),
        },
      });
      toast.success(`${students.length} absensi siswa berhasil dicatat.`);
      navigate("/attendances?category=student");
    } catch {
      toast.error("Absensi siswa gagal dicatat.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:px-10">
      <div className="mb-6">
        <Button
          variant="ghost"
          className="-ml-3 mb-3"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft /> Kembali
        </Button>
        <h2 className="text-xl font-bold tracking-tight">
          Tambah Absensi Siswa
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Catat status kehadiran siswa sekaligus.
        </p>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.04] sm:p-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-semibold">Informasi Absensi Siswa</h3>
            <div className="mt-3 flex gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs leading-5 text-blue-800">
              <CircleHelp className="size-4 shrink-0" />
              <p>
                Pilih grup jika ingin menampilkan siswa dari grup tertentu.
                Kosongkan untuk menampilkan semua siswa.
              </p>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Grup belajar (opsional)</Label>
              <Select
                value={groupId}
                onValueChange={(value) =>
                  setGroupId(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="!h-10 !w-full !bg-white !px-3 font-normal dark:!bg-white/[0.03]">
                  <SelectValue>
                    {groupId
                      ? getGroupLabel(
                          groups.find(
                            (group) => String(group.id) === groupId,
                          ) ?? {},
                        )
                      : "Semua siswa"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua siswa</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={String(group.id)} value={String(group.id)}>
                      {getGroupLabel(group)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Waktu absensi</Label>
              <Input
                type="datetime-local"
                className="h-10 bg-white px-3 text-sm dark:bg-white/[0.03]"
                value={checkInAt}
                onChange={(event) => setCheckInAt(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium">
              Pilih semua{"  "}
              <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700 text-xs">
                {selectedCount}
              </span>
            </span>
            <div className="flex gap-1">
              <Button
                type="button"
                className="p-4 bg-emerald-500 text-white hover:bg-emerald-600"
                onClick={() => selectAll("on_time")}
              >
                Hadir
              </Button>
              <Button
                type="button"
                className="p-4 bg-amber-400 text-white hover:bg-amber-500"
                onClick={() => selectAll("late")}
              >
                Terlambat
              </Button>
              <Button
                type="button"
                className="p-4 bg-red-600 text-white hover:bg-red-700"
                onClick={() => selectAll("absent")}
              >
                Tidak Hadir
              </Button>
            </div>
          </div>
          <div className="grid gap-3">
            {students.map((student) => {
              const id = String(student.id);
              const state = states[id] ?? { status: "on_time", reasonId: "" };
              return (
                <div
                  key={id}
                  className="rounded-xl border border-slate-200 p-4 dark:border-white/10"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-medium">
                      {String(student.name ?? student.email ?? id)}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(Object.keys(statusLabels) as StudentStatus[]).map(
                        (status) => (
                          <Button
                            key={status}
                            type="button"
                            variant={
                              state.status === status ? "default" : "outline"
                            }
                            className={
                              state.status === status
                                ? status === "on_time"
                                  ? "p-4 bg-emerald-500 hover:bg-emerald-600"
                                  : status === "late"
                                    ? "p-4 bg-amber-400 hover:bg-amber-500"
                                    : "p-4 bg-red-600 hover:bg-red-700"
                                : "p-4"
                            }
                            onClick={() => updateStatus(id, status)}
                          >
                            {statusLabels[status]}
                          </Button>
                        ),
                      )}
                    </div>
                  </div>
                  {state.status === "absent" ? (
                    <Select
                      value={state.reasonId}
                      onValueChange={(reasonId) =>
                        setStates((current) => ({
                          ...current,
                          [id]: { ...current[id], reasonId },
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1 bg-white !px-3">
                        <SelectValue>
                          {state.reasonId
                            ? getReasonLabel(
                                reasons.find(
                                  (reason) =>
                                    String(reason.id) === state.reasonId,
                                ) ?? {},
                              )
                            : "Pilih alasan tidak hadir"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {reasons.map((reason) => (
                          <SelectItem
                            key={String(reason.id)}
                            value={String(reason.id)}
                          >
                            {getReasonLabel(reason)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-100 pt-6 sm:col-span-2 sm:flex-row dark:border-white/10">
            <Button
              className="p-4"
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Batal
            </Button>
            <Button
              className="p-4 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
              type="submit"
              disabled={saving}
              onClick={() => void submit()}
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
