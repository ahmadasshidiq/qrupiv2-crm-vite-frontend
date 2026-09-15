import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  fetchRegionByCode,
  fetchRegions,
  type RegionLevel,
} from "@/lib/api/regions";
import type { PaginationFilters } from "@/lib/api/paginated";
import type { ApiRecordDto } from "@/lib/dto/api";

type RegionSelectProps = {
  name: string;
  level: RegionLevel;
  value: string;
  placeholder: string;
  disabled?: boolean;
  filters?: PaginationFilters;
  onValueChange: (code: string) => void;
};

function getRegionLabel(region: ApiRecordDto) {
  return String(region.name ?? region.code ?? "Wilayah");
}

export function RegionSelect({
  name,
  level,
  value,
  placeholder,
  disabled = false,
  filters = {},
  onValueChange,
}: RegionSelectProps) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ApiRecordDto[]>([]);
  const [open, setOpen] = useState(false);
  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    if (!value) return;

    let active = true;
    void fetchRegionByCode(level, value)
      .then((region) => {
        if (active && region) setQuery(getRegionLabel(region));
      })
      .catch(() => active && setQuery(value));
    return () => {
      active = false;
    };
  }, [level, value]);

  useEffect(() => {
    if (disabled) return;

    const timer = window.setTimeout(() => {
      void fetchRegions(level, { ...filters, ...(query ? { search: query } : {}) })
        .then((result) => setItems(result.items))
        .catch(() => setItems([]));
    }, query ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [disabled, filterKey, filters, level, query]);

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value} />
      <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
      <Input
        value={query}
        disabled={disabled}
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
      {open && !disabled ? (
        <div className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-zinc-900">
          {items.length ? (
            items.map((item) => (
              <button
                key={String(item.code ?? item.id)}
                type="button"
                className="flex w-full rounded-md px-2 py-2 text-left text-xs hover:bg-zinc-100 dark:hover:bg-white/10"
                onMouseDown={() => {
                  setQuery(getRegionLabel(item));
                  onValueChange(String(item.code ?? ""));
                  setOpen(false);
                }}
              >
                {getRegionLabel(item)}
              </button>
            ))
          ) : (
            <p className="px-2 py-2 text-xs text-zinc-500">Tidak ada wilayah yang sesuai.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
