import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const SEARCH_DEBOUNCE_MS = 300;

type SearchDropdownProps<T> = {
  items: T[];
  value: string;
  placeholder: string;
  className?: string;
  getLabel: (item: T) => string;
  onChange: (value: string) => void;
  fetchMatches: (query: string) => Promise<T[]>;
};

export function SearchDropdown<T>({
  items,
  value,
  placeholder,
  className,
  getLabel,
  onChange,
  fetchMatches,
}: SearchDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [remoteItems, setRemoteItems] = useState<T[]>([]);
  const localItems = useMemo(
    () =>
      items
        .filter((item) =>
          getLabel(item).toLowerCase().includes(value.toLowerCase()),
        )
        .slice(0, 5),
    [getLabel, items, value],
  );

  useEffect(() => {
    if (!open || !value || localItems.length) return;
    let active = true;
    const timer = window.setTimeout(() => {
      void fetchMatches(value)
        .then((data) => {
          if (active) setRemoteItems(data.slice(0, 5));
        })
        .catch(() => active && setRemoteItems([]));
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [fetchMatches, localItems.length, open, value]);

  const suggestions =
    value && localItems.length === 0
      ? remoteItems
      : value
        ? localItems
        : items.slice(0, 5);
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
      <Input
        value={value}
        placeholder={placeholder}
        className={`pl-9 ${className}`}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
      />
      {open ? (
        <div className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-zinc-900">
          {suggestions.length ? (
            suggestions.map((item, index) => (
              <button
                key={`${getLabel(item)}-${index}`}
                type="button"
                className="flex w-full rounded-md px-2 py-2 text-left text-xs hover:bg-zinc-100 dark:hover:bg-white/10"
                onMouseDown={() => onChange(getLabel(item))}
              >
                {getLabel(item)}
              </button>
            ))
          ) : (
            <p className="px-2 py-2 text-xs text-zinc-500">
              Tidak ada data yang sesuai.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
