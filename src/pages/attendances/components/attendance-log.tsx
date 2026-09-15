import { MapPin } from "lucide-react";
import type { ReactElement } from "react";
import type { ApiRecordDto } from "@/lib/dto/api";

type AttendancePhase = "check_in" | "check_out";

function formatAttendanceTime(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getMapsUrl(record: ApiRecordDto, phase: AttendancePhase) {
  const url = record[`${phase}_maps_url`] ?? record[`${phase}_location_url`];
  if (typeof url === "string" && /^https?:\/\//i.test(url)) return url;

  const latitude = record[`${phase}_latitude`] ?? record[`${phase}_lat`];
  const longitude =
    record[`${phase}_longitude`] ??
    record[`${phase}_long`] ??
    record[`${phase}_lng`];
  if (latitude !== undefined && longitude !== undefined) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;
  }

  const location = record[`${phase}_location`];
  if (typeof location === "string" && location.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  }

  return null;
}

export function AttendanceLog({
  record,
}: {
  record: ApiRecordDto;
}): ReactElement {
  const phases: Array<{ key: AttendancePhase; label: string; tone: string }> =
    record.type === "student"
      ? [
          {
            key: "check_in",
            label: "Masuk",
            tone: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
          },
        ]
      : [
          {
            key: "check_in",
            label: "Check-in",
            tone: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
          },
          {
            key: "check_out",
            label: "Check-out",
            tone: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900",
          },
        ];

  return (
    <div className="flex flex-wrap gap-2">
      {phases.map((phase) => {
        const mapsUrl = getMapsUrl(record, phase.key);
        const time = formatAttendanceTime(record[`${phase.key}_at`]);

        return (
          <span
            key={phase.key}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${phase.tone}`}
          >
            {phase.label}: {time}
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Buka lokasi ${phase.label} di Google Maps`}
                className="rounded-sm hover:opacity-70"
              >
                <MapPin className="size-3.5" />
              </a>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
