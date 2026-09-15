import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { fetchPaginated } from "@/lib/api/paginated";
import type { ApiRecordDto } from "@/lib/dto/api";

type ActivityCategorySelectProps = {
  name: string;
  value: string;
  required?: boolean;
  onValueChange: (value: string) => void;
};

const getCategoryLabel = (category: ApiRecordDto) =>
  String(category.name ?? category.id ?? "Kategori");

export function ActivityCategorySelect({
  name,
  value,
  required,
  onValueChange,
}: ActivityCategorySelectProps) {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<ApiRecordDto[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchPaginated<ApiRecordDto>(
        "/activity-categories",
        1,
        100,
        query ? { name: query } : {},
      )
        .then((result) => setCategories(result.items))
        .catch(() => setCategories([]));
    }, query ? 300 : 0);

    return () => window.clearTimeout(timer);
  }, [query]);

  const selectedCategory = categories.find(
    (category) => String(category.id ?? "") === value,
  );
  const displayValue = query || (selectedCategory ? getCategoryLabel(selectedCategory) : "");

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value} required={required} />
      <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
      <Input
        value={displayValue}
        placeholder="Cari kategori aktivitas"
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
          {categories.length ? (
            categories.map((category) => (
              <button
                key={String(category.id)}
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs hover:bg-zinc-100 dark:hover:bg-white/10"
                onMouseDown={() => {
                  setQuery(getCategoryLabel(category));
                  onValueChange(String(category.id ?? ""));
                  setOpen(false);
                }}
              >
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: String(category.color ?? "#2563eb") }}
                />
                {getCategoryLabel(category)}
              </button>
            ))
          ) : (
            <p className="px-2 py-2 text-xs text-zinc-500">Kategori tidak ditemukan.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
