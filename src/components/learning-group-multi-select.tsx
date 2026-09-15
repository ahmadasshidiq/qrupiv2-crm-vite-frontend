import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchPaginated } from "@/lib/api/paginated";
import type { ApiRecordDto } from "@/lib/dto/api";
import { getAuthUser } from "@/lib/auth/session";

type LearningGroupMultiSelectProps = {
  name: string;
  value: string[];
  required?: boolean;
  onValueChange: (value: string[]) => void;
};

const getGroupName = (group: ApiRecordDto) =>
  String(group.name ?? group.code ?? "Grup tanpa nama");

export function LearningGroupMultiSelect({
  name,
  value,
  required,
  onValueChange,
}: LearningGroupMultiSelectProps) {
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<ApiRecordDto[]>([]);
  const [loading, setLoading] = useState(true);
  const institutionId = getAuthUser()?.institution?.id ?? "";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      void fetchPaginated<ApiRecordDto>(
        "/learning-groups",
        1,
        500,
        {
          ...(query ? { "lg.name.ilike": `%${query}%` } : {}),
          ...(institutionId ? { "lg.institution_id": institutionId } : {}),
        },
      )
        .then((result) =>
          setGroups(
            institutionId
              ? result.items.filter(
                  (group) => String(group.institution_id ?? "") === institutionId,
                )
              : result.items,
          ),
        )
        .catch(() => setGroups([]))
        .finally(() => setLoading(false));
    }, query ? 300 : 0);

    return () => window.clearTimeout(timer);
  }, [institutionId, query]);

  const selectedIds = useMemo(() => new Set(value), [value]);
  const toggleGroup = (id: string) => {
    onValueChange(
      selectedIds.has(id)
        ? value.filter((selectedId) => selectedId !== id)
        : [...value, id],
    );
  };
  const selectAllResults = () => {
    onValueChange([
      ...value,
      ...groups
        .map((group) => String(group.id ?? ""))
        .filter((id) => id && !selectedIds.has(id)),
    ]);
  };

  return (
    <div className="rounded-xl border border-input bg-white p-2 dark:bg-white/[0.03]">
      {value.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      {required ? (
        <input
          className="sr-only"
          tabIndex={-1}
          value={value.length ? "terpilih" : ""}
          onChange={() => undefined}
          required
          aria-label="Pilih minimal satu grup pembelajaran"
        />
      ) : null}
      <div className="flex items-center gap-2">
        <Search className="ml-1 size-4 text-zinc-400" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari kelas atau grup penerima"
          className="h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 border-y border-slate-100 py-2 dark:border-white/10">
        <span className="text-xs text-zinc-500">
          {value.length} grup dipilih
        </span>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={selectAllResults}>
            Pilih semua hasil
          </Button>
          {value.length ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onValueChange([])}>
              Hapus pilihan
            </Button>
          ) : null}
        </div>
      </div>
      <div className="mt-1 max-h-48 overflow-y-auto">
        {loading ? (
          <p className="px-2 py-3 text-xs text-zinc-500">Memuat grup...</p>
        ) : groups.length ? (
          groups.map((group) => {
            const id = String(group.id ?? "");
            const selected = selectedIds.has(id);
            return (
              <button
                key={id}
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-white/10"
                onClick={() => toggleGroup(id)}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{getGroupName(group)}</span>
                  <span className="block truncate text-xs text-zinc-500">
                    {String(group.institution_name ?? "Institusi sendiri")}
                  </span>
                </span>
                <span className={`grid size-5 shrink-0 place-items-center rounded-md border ${selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 text-transparent dark:border-white/20"}`}>
                  <Check className="size-3.5" />
                </span>
              </button>
            );
          })
        ) : (
          <p className="px-2 py-3 text-xs text-zinc-500">Grup pembelajaran tidak ditemukan.</p>
        )}
      </div>
      {value.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((id) => {
            const group = groups.find((item) => String(item.id ?? "") === id);
            return (
              <button
                key={id}
                type="button"
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700 dark:bg-blue-950/40 dark:text-blue-200"
                onClick={() => toggleGroup(id)}
              >
                {group ? getGroupName(group) : "Grup terpilih"}
                <X className="size-3" />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
