import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { fetchPaginated } from "@/lib/api/paginated";
import type { ApiRecordDto } from "@/lib/dto/api";

type RoleSelectProps = {
  name: string;
  value: string;
  required?: boolean;
  onValueChange: (value: string) => void;
};

const getRoleLabel = (role: ApiRecordDto) =>
  String(role.name ?? role.slug ?? role.id ?? "Role");

export function RoleSelect({ name, value, required, onValueChange }: RoleSelectProps) {
  const [query, setQuery] = useState("");
  const [roles, setRoles] = useState<ApiRecordDto[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchPaginated("/roles", 1, 100, query ? { search: query } : {})
        .then((result) => setRoles(result.items))
        .catch(() => setRoles([]));
    }, query ? 300 : 0);

    return () => window.clearTimeout(timer);
  }, [query]);

  const selectedRole = roles.find((role) => String(role.id ?? "") === value);
  const displayValue = query || (selectedRole ? getRoleLabel(selectedRole) : "");

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value} required={required} />
      <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
      <Input
        value={displayValue}
        placeholder="Cari dan pilih role"
        className="h-10 bg-white pl-9 text-sm dark:bg-white/[0.03]"
        onFocus={() => {
          if (!query && selectedRole) setQuery("");
          setOpen(true);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onChange={(event) => {
          setQuery(event.target.value);
          onValueChange("");
          setOpen(true);
        }}
      />
      {open ? (
        <div className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-zinc-900">
          {roles.length ? (
            roles.map((role) => (
              <button
                key={String(role.id)}
                type="button"
                className="flex w-full rounded-md px-2 py-2 text-left text-xs hover:bg-zinc-100 dark:hover:bg-white/10"
                onMouseDown={() => {
                  setQuery(getRoleLabel(role));
                  onValueChange(String(role.id ?? ""));
                  setOpen(false);
                }}
              >
                {getRoleLabel(role)}
              </button>
            ))
          ) : (
            <p className="px-2 py-2 text-xs text-zinc-500">Role tidak ditemukan.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
