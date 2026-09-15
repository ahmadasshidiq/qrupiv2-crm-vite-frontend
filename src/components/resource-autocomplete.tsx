import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { fetchPaginated, type PaginationFilters } from "@/lib/api/paginated";
import type { ApiRecordDto } from "@/lib/dto/api";

type ResourceAutocompleteProps = {
  name: string;
  value: string;
  endpoint: string;
  filters?: PaginationFilters;
  placeholder?: string;
  required?: boolean;
  onValueChange: (value: string) => void;
};

function getResourceLabel(record: ApiRecordDto) {
  return String(record.name ?? record.title ?? record.email ?? record.id ?? "Data");
}

export function ResourceAutocomplete({
  name,
  value,
  endpoint,
  filters,
  placeholder = "Cari data",
  required,
  onValueChange,
}: ResourceAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ApiRecordDto[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void fetchPaginated<ApiRecordDto>(endpoint, 1, 500, filters)
      .then((result) => setItems(result.items))
      .catch(() => setItems([]));
  }, [endpoint, filters]);

  const matchingItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return items;
    return items.filter((item) =>
      `${getResourceLabel(item)} ${String(item.code ?? "")}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [items, query]);
  const selectedItem = items.find((item) => String(item.id ?? "") === value);
  const displayValue = query || (selectedItem ? getResourceLabel(selectedItem) : "");

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value} required={required} />
      <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
      <Input
        value={displayValue}
        placeholder={placeholder}
        className="h-10 bg-white pl-9 text-sm dark:bg-white/[0.03]"
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onChange={(event) => {
          setQuery(event.target.value);
          onValueChange("");
          setOpen(true);
        }}
      />
      {open ? (
        <div className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-zinc-900">
          {matchingItems.length ? (
            matchingItems.map((item) => (
              <button
                key={String(item.id)}
                type="button"
                className="flex w-full flex-col rounded-md px-2 py-2 text-left text-xs hover:bg-zinc-100 dark:hover:bg-white/10"
                onMouseDown={() => {
                  setQuery(getResourceLabel(item));
                  onValueChange(String(item.id ?? ""));
                  setOpen(false);
                }}
              >
                <span>{getResourceLabel(item)}</span>
                {item.code || item.institution_name ? (
                  <span className="mt-0.5 text-[10px] text-zinc-500">
                    {[item.code, item.institution_name].filter(Boolean).join(" · ")}
                  </span>
                ) : null}
              </button>
            ))
          ) : (
            <p className="px-2 py-2 text-xs text-zinc-500">Data tidak ditemukan.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
