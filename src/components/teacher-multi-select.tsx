import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchPaginated, type PaginationFilters } from "@/lib/api/paginated";
import type { ApiRecordDto } from "@/lib/dto/api";

type Props = {
  name: string;
  endpoint: string;
  filters?: PaginationFilters;
  value: string[];
  required?: boolean;
  placeholder?: string;
  onValueChange: (value: string[]) => void;
};
const label = (item: ApiRecordDto) =>
  String(item.name ?? item.title ?? item.email ?? item.id ?? "Data");

export function TeacherMultiSelect({
  name,
  endpoint,
  filters,
  value,
  required,
  placeholder = "Cari data",
  onValueChange,
}: Props) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ApiRecordDto[]>([]);
  useEffect(() => {
    void fetchPaginated<ApiRecordDto>(endpoint, 1, 500, filters)
      .then((result) => setItems(result.items))
      .catch(() => setItems([]));
  }, [endpoint, filters]);
  const matching = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? items.filter((item) => label(item).toLowerCase().includes(q))
      : items;
  }, [items, query]);
  const selected = new Set(value);
  const toggle = (id: string) =>
    onValueChange(
      selected.has(id) ? value.filter((item) => item !== id) : [...value, id],
    );
  const selectAll = () =>
    onValueChange([
      ...new Set([...value, ...matching.map((item) => String(item.id))]),
    ]);
  return (
    <div className="rounded-xl border border-input bg-white p-2 dark:bg-white/[0.03]">
      {value.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      {required ? (
        <input
          className="sr-only"
          tabIndex={-1}
          value={value.length ? "selected" : ""}
          onChange={() => undefined}
          required
          aria-label="Pilih minimal satu data"
        />
      ) : null}
      <div className="flex items-center gap-2">
        <Search className="ml-1 size-4 text-zinc-400" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
        />
      </div>
      <div className="mt-2 flex items-center justify-between border-y border-slate-100 py-2 dark:border-white/10">
        <span className="text-xs text-zinc-500">
          {value.length} guru dipilih
        </span>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={selectAll}>
            Pilih semua hasil
          </Button>
          {value.length ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onValueChange([])}
            >
              Hapus pilihan
            </Button>
          ) : null}
        </div>
      </div>
      <div className="mt-1 max-h-48 overflow-y-auto">
        {matching.length ? (
          matching.map((item) => {
            const id = String(item.id);
            const isSelected = selected.has(id);
            return (
              <button
                key={id}
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-white/10"
                onClick={() => toggle(id)}
              >
                <span className="truncate text-sm font-medium">
                  {label(item)}
                </span>
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-md border ${isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 text-transparent dark:border-white/20"}`}
                >
                  <Check className="size-3.5" />
                </span>
              </button>
            );
          })
        ) : (
          <p className="px-2 py-3 text-xs text-zinc-500">
            Guru tidak ditemukan.
          </p>
        )}
      </div>
      {value.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((id) => (
            <button
              key={id}
              type="button"
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700 dark:bg-blue-950/40 dark:text-blue-200"
              onClick={() => toggle(id)}
            >
              {label(items.find((item) => String(item.id) === id) ?? { id })}
              <X className="size-3" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
