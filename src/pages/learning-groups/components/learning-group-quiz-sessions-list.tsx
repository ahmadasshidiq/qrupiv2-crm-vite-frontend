import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { SearchDropdown } from "@/components/search-dropdown";
import { Badge } from "@/components/ui/badge";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import type { ApiRecordDto } from "@/lib/dto/api";
import { fetchQuizSessions } from "@/pages/quiz-sessions/actions";
import { toast } from "sonner";
import { LearningGroupDetailTable } from "./learning-group-detail-table";

function scoreClass(score: number) {
  if (score <= 60) return "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900";
  if (score <= 79) return "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:ring-orange-900";
  return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900";
}

function statusClass(status: unknown) {
  const normalizedStatus = String(status ?? "").toLowerCase();

  if (normalizedStatus === "submitted") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900";
  }

  if (normalizedStatus === "timeout" || normalizedStatus === "failed") {
    return "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900";
  }

  if (normalizedStatus === "in_progress") {
    return "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900";
  }

  return "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/10";
}
const warningClass = "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900";

export function LearningGroupQuizSessionsList({ groupId }: { groupId: string }) {
  const [sessions, setSessions] = useState<ApiRecordDto[]>([]);
  const [participants, setParticipants] = useState<ApiRecordDto[]>([]);
  const [participantName, setParticipantName] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    let active = true;
    const task = window.setTimeout(() => {
      setLoading(true);
      void fetchQuizSessions(1, 12, { learning_group_id: groupId })
        .then((result) => {
          if (!active) return;
          setSessions(result.items);
          const unique = new Map<string, ApiRecordDto>();
          result.items.forEach((item) => {
            if (item.user_id) unique.set(String(item.user_id), item);
          });
          setParticipants(Array.from(unique.values()));
        })
        .catch((error) => {
          if (!active) return;
          toast.error(
            error instanceof ApiError
              ? error.message
              : "Riwayat sesi gagal dimuat.",
          );
        })
        .finally(() => active && setLoading(false));
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(task);
    };
  }, [groupId]);

  useEffect(() => {
    if (!groupId || !userId) return;
    let active = true;
    const task = window.setTimeout(() => {
      setLoading(true);
      void fetchQuizSessions(1, 12, {
        learning_group_id: groupId,
        user_id: userId,
      })
        .then((result) => active && setSessions(result.items))
        .catch(() => active && setSessions([]))
        .finally(() => active && setLoading(false));
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(task);
    };
  }, [groupId, userId]);

  return (
    <section className="border-t border-slate-100 pt-6 dark:border-white/10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
            <ClipboardList className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Riwayat Sesi & Nilai</h3>
            <p className="text-xs text-zinc-500">
              {loading ? "Memuat riwayat..." : `${sessions.length} sesi tersedia`}
            </p>
          </div>
        </div>
        <div className="w-full max-w-80">
          <SearchDropdown
            items={participants}
            value={participantName}
            placeholder="Cari peserta.."
            className="h-9 w-full text-xs"
            getLabel={(participant) => String(participant.user_name ?? "-")}
            onChange={(value) => {
              setParticipantName(value);
              const participant = participants.find(
                (item) => String(item.user_name ?? "") === value,
              );
              setUserId(String(participant?.user_id ?? ""));
            }}
            fetchMatches={async (query) =>
              participants.filter((participant) =>
                String(participant.user_name ?? "")
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
            }
          />
        </div>
      </div>

      {loading ? (
        <div className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-white/10" />
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-slate-200 px-4 py-6 text-center text-sm text-zinc-500 dark:border-white/10">
          Belum ada riwayat sesi untuk grup ini.
        </div>
      ) : (
        <LearningGroupDetailTable
          headers={["Kuis", "Peserta", "Status", "Nilai", "Peringatan"]}
        >
          {sessions.map((session) => (
            <TableRow key={String(session.id)}>
              <TableCell className="px-4 py-3 font-medium">
                {String(session.quiz_title ?? "-")}
              </TableCell>
              <TableCell className="px-4 py-3 text-zinc-500">
                {String(session.user_name ?? "-")}
              </TableCell>
              <TableCell className="px-4 py-3">
                <Badge className={statusClass(session.status)}>
                  {String(session.status ?? "-") === "in_progress"
                    ? "In Progress"
                    : String(session.status ?? "-")}
                </Badge>
              </TableCell>
              <TableCell className="px-4 py-3">
                <Badge className={scoreClass(Number(session.score ?? 0))}>
                  {String(session.score ?? 0)}
                </Badge>
              </TableCell>
              <TableCell className="px-4 py-3">
                {Number(session.cheating_count ?? 0) === 0 ? (
                  "-"
                ) : (
                  <Badge className={warningClass}>
                    {String(session.cheating_count)}
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </LearningGroupDetailTable>
      )}
    </section>
  );
}
