import { useEffect, useState } from "react";
import { FileText, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/api/client";
import type { AttendanceCategory } from "../actions";
import type { ApiRecordDto } from "@/lib/dto/api";
import { getAuthUser } from "@/lib/auth/session";
import qrupiLogo from "@/assets/qrupi-logo.png";
import { buildAttendanceReportTemplate } from "../templates/attendance-report-template";

function formatDate(value: unknown) {
  if (!value || value === "-") return "-";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

function monthRange(from: string, to: string) {
  const result: string[] = [];
  const [startYear, startMonth] = from.split("-").map(Number);
  const [endYear, endMonth] = to.split("-").map(Number);
  for (
    let year = startYear, month = startMonth;
    year < endYear || (year === endYear && month <= endMonth);
    month += 1
  ) {
    result.push(`${year}-${String(month).padStart(2, "0")}`);
    if (month === 12) {
      year += 1;
      month = 0;
    }
  }
  return result;
}

function monthEndDate(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return `${month}-${String(new Date(year, monthNumber, 0).getDate()).padStart(2, "0")}`;
}

function html(value: unknown) {
  return String(value ?? "-").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ] ?? character,
  );
}

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

function getAbsenceReason(
  record: ApiRecordDto,
  reasonNames: Map<string, string> = new Map(),
) {
  return String(
    (record.absence_reason_id
      ? reasonNames.get(String(record.absence_reason_id))
      : undefined) ??
      record.absence_reason_name ??
      record.absence_reason ??
      record.reason_name ??
      record.reason ??
      "Alpa",
  );
}

function getAttendanceDate(record: ApiRecordDto) {
  return (
    record.attendance_date ??
    record.check_in_date ??
    record.date ??
    record.created_at
  );
}

function getStudentContextCode(record: ApiRecordDto) {
  return String(record.user_context_code ?? "-");
}

function renderAbsenceDetails(
  people: ApiRecordDto[],
  getRecords: (person: ApiRecordDto) => ApiRecordDto[],
  month: string,
  reasonNames: Map<string, string>,
) {
  return people
    .map((person) => {
      const details = getRecords(person)
        .filter(
          (record) =>
            record.status === "absent" &&
            String(getAttendanceDate(record) ?? "").slice(0, 7) === month,
        )
        .map(
          (record) =>
            `• <strong>${html(getAbsenceReason(record, reasonNames))}</strong> - Tanggal ${formatDate(getAttendanceDate(record))}`,
        )
        .join("<br>");
      return details
        ? `<div class="absence-detail"><strong>${html(person.user_name)}</strong><br>${details}</div>`
        : "";
    })
    .join("");
}

function renderSummaryTable(
  headers: string,
  rows: string,
  emptyColspan: number,
) {
  return `<table class="student-summary"><thead><tr>${headers}</tr></thead><tbody>${rows || `<tr><td colspan="${emptyColspan}">Tidak ada data absensi pada bulan ini.</td></tr>`}</tbody></table>`;
}

export function AttendanceReportDialog({
  category,
  open,
  onOpenChange,
}: {
  category: AttendanceCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedGroupLabel, setSelectedGroupLabel] = useState(
    "Semua Grup Belajar",
  );
  const [learningGroups, setLearningGroups] = useState<ApiRecordDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || category !== "student") return;
    void apiRequest<{ data?: unknown }>("/learning-groups?page=1&limit=5000")
      .then((response) => {
        const root = response.data as
          | { data?: unknown; items?: unknown[] }
          | unknown[]
          | undefined;
        const nested = root && !Array.isArray(root) ? root.data : undefined;
        const values = Array.isArray(response.data)
          ? response.data
          : Array.isArray(root)
            ? root
            : Array.isArray(nested)
              ? nested
              : nested &&
                  typeof nested === "object" &&
                  "data" in nested &&
                  Array.isArray(nested.data)
                ? nested.data
                : [];
        setLearningGroups(values as ApiRecordDto[]);
      })
      .catch(() => setLearningGroups([]));
  }, [category, open]);

  async function printReport() {
    if (!from || !to) return toast.error("Pilih bulan mulai dan bulan akhir.");
    if (from > to)
      return toast.error("Bulan mulai tidak boleh melebihi bulan akhir.");
    setLoading(true);
    try {
      const attendanceParams = new URLSearchParams({
        page: "1",
        limit: "5000",
        sortOrder: "desc",
        "u.type": category,
        "al.created_at.gte": `${from}-01`,
        "al.created_at.lte": `${monthEndDate(to)} 23:59:59`,
      });
      if (category === "student" && selectedGroupId) {
        attendanceParams.set("al.learning_group_id", selectedGroupId);
      }
      const [response, reasonResponse] = await Promise.all([
        apiRequest<{ data?: unknown }>(`/attendance-logs?${attendanceParams}`),
        apiRequest<{ data?: unknown }>(
          "/attendance-absence-reasons?page=1&limit=5000",
        ),
      ]);
      const nested = response.data as { data?: unknown } | undefined;
      const reasonNested = reasonResponse.data as
        | { data?: unknown; items?: unknown[] }
        | undefined;
      const reasonData = reasonNested?.data as
        | { data?: unknown; items?: unknown[] }
        | unknown[]
        | undefined;
      const reasonRecords = (
        Array.isArray(reasonResponse.data)
          ? reasonResponse.data
          : Array.isArray(reasonNested?.data)
            ? reasonNested.data
            : Array.isArray(reasonData)
              ? reasonData
              : reasonData &&
                  typeof reasonData === "object" &&
                  "data" in reasonData &&
                  Array.isArray(reasonData.data)
                ? reasonData.data
                : reasonData &&
                    typeof reasonData === "object" &&
                    "items" in reasonData &&
                    Array.isArray(reasonData.items)
                  ? reasonData.items
                  : Array.isArray(reasonNested?.items)
                    ? reasonNested.items
                    : []
      ) as ApiRecordDto[];
      const reasonNames = new Map(
        reasonRecords
          .filter((reason) => reason.id != null)
          .map((reason) => [
            String(reason.id),
            String(
              reason.name ??
                reason.reason ??
                reason.label ??
                reason.title ??
                "Alpa",
            ),
          ]),
      );
      const allAbsenceReasons = [
        ...new Set(
          reasonRecords
            .map((reason) =>
              String(
                reason.name ?? reason.reason ?? reason.label ?? reason.title ?? "",
              ).trim(),
            )
            .filter(Boolean),
        ),
      ];
      const records = (
        Array.isArray(response.data)
          ? response.data
          : Array.isArray(nested?.data)
            ? nested.data
            : []
      ) as ApiRecordDto[];
      const filtered = records.filter((record) => {
        const date = String(getAttendanceDate(record) ?? "").slice(0, 7);
        return date >= from && date <= to;
      });
      const title =
        category === "student"
          ? "Laporan Absensi Siswa"
          : "Laporan Absensi Guru";
      const user = getAuthUser();
      const institution = user?.institution as
        | (Record<string, unknown> & {
            name?: string;
            file_url?: string;
            avatar_url?: string;
          })
        | null
        | undefined;
      const schoolLogo = String(
        institution?.file_url ?? institution?.avatar_url ?? "",
      );
      const institutionName = String(institution?.name ?? "Institusi");
      const institutionPhone = String(institution?.phone ?? "");
      const institutionWebsite = String(institution?.website ?? "");
      const institutionAddress = String(institution?.address ?? "");
      const reportMonths = monthRange(from, to);
      const students = [
        ...new Map(
          filtered.map((record) => [
            String(record.user_id ?? record.user_name),
            record,
          ]),
        ).values(),
      ];
      const studentRecords = new Map(
        students.map((student) => [
          String(student.user_id ?? student.user_name),
          filtered.filter(
            (record) =>
              String(record.user_id ?? record.user_name) ===
              String(student.user_id ?? student.user_name),
          ),
        ]),
      );
      const studentSummaryTable = reportMonths
        .map((month) => {
          const monthStudents = students.filter((student) =>
            (
              studentRecords.get(
                String(student.user_id ?? student.user_name),
              ) ?? []
            ).some(
              (record) =>
                String(getAttendanceDate(record) ?? "").slice(0, 7) === month,
            ),
          );
          const monthRecords = monthStudents.flatMap((student) =>
            (
              studentRecords.get(
                String(student.user_id ?? student.user_name),
              ) ?? []
            ).filter(
              (record) =>
                record.status === "absent" &&
                String(getAttendanceDate(record) ?? "").slice(0, 7) === month,
            ),
          );
          const absenceReasons = [
            ...new Set(
              reasonRecords
                .map((reason) =>
                  String(
                    reason.name ??
                      reason.reason ??
                      reason.label ??
                      reason.title ??
                      "",
                  ).trim(),
                )
                .filter(Boolean),
            ),
            ...new Set(
              monthRecords
                .map((record) => getAbsenceReason(record, reasonNames))
                .filter(
                  (reason) =>
                    !reasonRecords.some(
                      (item) =>
                        String(
                          item.name ??
                            item.reason ??
                            item.label ??
                            item.title ??
                            "",
                        ) === reason,
                    ),
                ),
            ),
          ];
          const studentSummaryRows = monthStudents
            .map((student) => {
              const records = (
                studentRecords.get(
                  String(student.user_id ?? student.user_name),
                ) ?? []
              ).filter(
                (record) =>
                  String(getAttendanceDate(record) ?? "").slice(0, 7) === month,
              );
              const present = records.filter(
                (record) => record.status !== "absent",
              ).length;
              const late = records.filter(
                (record) => record.status === "late",
              ).length;
              const reasonCounts = absenceReasons
                .map(
                  (reason) =>
                    `<td style="text-align: center;width: 8%">${records.filter((record) => record.status === "absent" && getAbsenceReason(record, reasonNames) === reason).length}</td>`,
                )
                .join("");
              return `
              <tr>
                <td>${html(getStudentContextCode(student))}</td>
                <td>${html(student.user_name)}</td>
                <td>${html(student.learning_group_name)}</td>
                <td style="text-align: center;width: 8%">${present}</td>
                <td style="text-align: center;width: 8%">${late}</td>
                ${reasonCounts}
              </tr>`;
            })
            .join("");
          const absenceDetails = monthStudents
            .map((student) => {
              const records = (
                studentRecords.get(
                  String(student.user_id ?? student.user_name),
                ) ?? []
              ).filter(
                (record) =>
                  record.status === "absent" &&
                  String(getAttendanceDate(record) ?? "").slice(0, 7) === month,
              );
              const details = records
                .map(
                  (record) =>
                    `• <strong>${html(getAbsenceReason(record, reasonNames))}</strong> - Tanggal ${formatDate(getAttendanceDate(record))}`,
                )
                .join("<br>");
              return details
                ? `<div class="absence-detail">
                    <strong>${html(student.user_name)}</strong>
                    <br>${details}
                   </div>`
                : "";
            })
            .join("");
          const table = renderSummaryTable(
            `
            <th>No Identitas</th>
            <th>Nama Siswa</th>
            <th>Grup Belajar</th>
            <th style="text-align: center;width: 8%">Hadir</th>
            <th style="text-align: center;width: 8%">Terlambat</th>
            ${absenceReasons.map((reason) => `<th style="text-align: center;width: 8%">${html(reason)}</th>`).join("")}`,
            studentSummaryRows,
            5 + absenceReasons.length,
          );
          return `
          <h2 class="month-title">${formatMonthLabel(month)}</h2>
            ${table}
          <h2 class="absence-title">Keterangan Ketidakhadiran</h2>
          <div class="absence-details">
            ${absenceDetails || "Tidak ada ketidakhadiran pada bulan ini."}
          </div>`;
        })
        .join('<div class="page-break"></div>');
      const teacherMonthlyTable = reportMonths
        .map((month) => {
          const monthRecords = filtered
            .filter(
              (record) =>
                String(getAttendanceDate(record) ?? "").slice(0, 7) === month,
            );
          const teachers = [
            ...new Map(
              monthRecords.map((record) => [
                String(record.user_id ?? record.user_name),
                record,
              ]),
            ).values(),
          ];
          const teacherRows = teachers
            .map((teacher) => {
              const records = monthRecords.filter(
                (record) =>
                  String(record.user_id ?? record.user_name) ===
                  String(teacher.user_id ?? teacher.user_name),
              );
              const present = records.filter(
                (record) => record.status !== "absent",
              ).length;
              const reasonCounts = allAbsenceReasons
                .map(
                  (reason) =>
                    `<td style="text-align: center;width: 8%;">${records.filter((record) => record.status === "absent" && getAbsenceReason(record, reasonNames) === reason).length}</td>`,
                )
                .join("");
              const late = records.filter(
                (record) => record.status === "late",
              ).length;
              return `
              <tr>
                <td>${html(getStudentContextCode(teacher))}</td>
                <td>${html(teacher.user_name)}</td>
                <td>${html(teacher.user_email)}</td>
                <td style="text-align: center;width: 8%;">${present}</td>
                <td style="text-align: center;width: 8%;">${late}</td>
                ${reasonCounts}
              </tr>`;
            })
            .join("");
          const absenceDetails = renderAbsenceDetails(
            teachers,
            (teacher) =>
              monthRecords.filter(
                (record) =>
                  String(record.user_id ?? record.user_name) ===
                  String(teacher.user_id ?? teacher.user_name),
              ),
            month,
            reasonNames,
          );
          const table = renderSummaryTable(
            `
            <th>No Identitas</th>
            <th>Nama</th>
            <th>Email</th>
            <th style="text-align: center;width: 8%;">Hadir</th>
            <th style="text-align: center;width: 8%;">Terlambat</th>
            ${allAbsenceReasons.map((reason) => `<th style="text-align: center;width: 8%;">${html(reason)}</th>`).join("")}`,
            teacherRows,
            5 + allAbsenceReasons.length,
          );
          return `
          <h2 class="month-title">${formatMonthLabel(month)}</h2>
            ${table}
          <h2 class="absence-title">Keterangan Ketidakhadiran</h2>
          <div class="absence-details">
            ${absenceDetails || "Tidak ada ketidakhadiran pada bulan ini."}
          </div>`;
        })
        .join('<div class="page-break"></div>');
      const reportTable =
        category === "student" ? studentSummaryTable : teacherMonthlyTable;
      const report = window.open("", "_blank", "width=1200,height=800");
      if (!report)
        return toast.error("Izinkan pop-up browser untuk mencetak report.");
      report.document.write(
        buildAttendanceReportTemplate({
          title,
          institutionName: html(institutionName),
          institutionAddress: html(institutionAddress),
          institutionPhone: html(institutionPhone),
          institutionWebsite: html(institutionWebsite),
          schoolLogo: html(schoolLogo),
          qrupiLogo: html(qrupiLogo),
          period: `${formatMonthLabel(from)} - ${formatMonthLabel(to)}`,
          content: reportTable,
          generatedAt: new Date().toLocaleString("id-ID"),
        }),
      );
      report.document.close();
      report.focus();
      window.setTimeout(() => report.print(), 300);
      onOpenChange(false);
      return;
      if (!report) return;
    } catch {
      toast.error("Report absensi gagal dibuat.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setFrom("");
          setTo("");
          setSelectedGroupId("");
          setSelectedGroupLabel("Semua Grup Belajar");
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg gap-6 rounded-2xl p-5 sm:max-w-lg">
        <DialogHeader className="gap-1">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <FileText className="size-5" />
            Report Absensi PDF
          </DialogTitle>
          <DialogDescription>
            Pilih periode{category === "student" ? " dan grup belajar" : ""}{" "}
            untuk membuat laporan absensi{" "}
            {category === "student" ? "siswa" : "guru"}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {category === "student" ? (
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="attendance-report-group">Grup belajar</Label>
              <Select
                value={selectedGroupId || "__all__"}
                onValueChange={(value) => {
                  if (!value || value === "__all__") {
                    setSelectedGroupId("");
                    setSelectedGroupLabel("Semua Grup Belajar");
                    return;
                  }
                  const selectedGroup = learningGroups.find(
                    (group) => String(group.id) === value,
                  );
                  setSelectedGroupId(value);
                  setSelectedGroupLabel(
                    String(selectedGroup?.name ?? "Grup belajar"),
                  );
                }}
              >
                <SelectTrigger
                  className="!h-10 !w-full !bg-white !px-3 font-normal dark:!bg-white/[0.03]"
                  style={{ fontSize: "0.75rem", lineHeight: "1.625" }}
                >
                  <SelectValue>{selectedGroupLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">
                    Semua Grup Belajar
                  </SelectItem>
                  {learningGroups.map((group) => (
                    <SelectItem key={String(group.id)} value={String(group.id)}>
                      {String(group.name ?? "Grup belajar")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="grid gap-1.5">
            <Label htmlFor="attendance-report-from">Bulan mulai</Label>
            <Input
              id="attendance-report-from"
              className="!h-10 !rounded-lg !px-3"
              type="month"
              value={from}
              max={to || undefined}
              onChange={(event) => {
                const value = event.target.value;
                setFrom(value);
                if (to && value > to) setTo(value);
              }}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="attendance-report-to">Bulan akhir</Label>
            <Input
              id="attendance-report-to"
              className="!h-10 !rounded-lg !px-3"
              type="month"
              value={to}
              min={from || undefined}
              onChange={(event) => {
                const value = event.target.value;
                setTo(value);
                if (from && value < from) setFrom(value);
              }}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            className="p-4"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            className="p-4 bg-blue-600 text-white hover:bg-blue-700"
            disabled={loading}
            onClick={() => void printReport()}
          >
            {loading ? <LoaderCircle className="animate-spin" /> : <FileText />}{" "}
            Buat PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
