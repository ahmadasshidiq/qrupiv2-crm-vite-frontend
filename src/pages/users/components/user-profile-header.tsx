import qrupiLogo from "@/assets/qrupi-logo.png";
import { Badge } from "@/components/ui/badge";
import type { ApiRecordDto } from "@/lib/dto/api";
import { UserQrCard } from "@/pages/users/components/user-qr-card";

const USER_TYPE_LABELS: Record<string, string> = {
  student: "Siswa",
  teacher: "Guru",
  admin: "Admin",
  staff: "Staf",
};

export function UserProfileHeader({ record }: { record: ApiRecordDto }) {
  const name = record.name ? String(record.name) : "-";
  const avatar =
    typeof record.avatar_url === "string" && record.avatar_url.trim() && record.avatar_url !== "-"
      ? record.avatar_url
      : null;
  const barcode = record.barcode ? String(record.barcode) : null;
  const isActive = record.status === "active";
  const identity = [record.context_type, record.context_code].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-6 rounded-xl bg-slate-50 p-6 dark:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-sm dark:border-white/10">
          <img
            src={avatar ?? qrupiLogo}
            alt={`Foto ${name}`}
            className={avatar ? "size-full object-cover" : "size-full object-contain p-4"}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = qrupiLogo;
              event.currentTarget.className = "size-full object-contain p-4";
            }}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <h3 className="text-xl font-bold tracking-tight">{name}</h3>
          {identity ? <p className="text-sm text-zinc-500">{identity}</p> : null}
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              {USER_TYPE_LABELS[String(record.type)] ?? String(record.type ?? "-")}
            </Badge>
            <Badge
              className={
                isActive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300"
              }
            >
              {isActive ? "Aktif" : "Tidak Aktif"}
            </Badge>
          </div>
        </div>
      </div>
      {barcode ? <UserQrCard code={barcode} name={name} /> : null}
    </div>
  );
}
