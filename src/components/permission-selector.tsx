import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api/client";

export type Permission = { model: string; action: string };
type PermissionGroup = { title: string; permissions: Permission[] };

export function PermissionSelector({
  name,
  value = [],
  required,
}: {
  name: string;
  value?: Permission[];
  required?: boolean;
}) {
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [selected, setSelected] = useState<Permission[]>(value);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void apiRequest<{ data?: PermissionGroup[] }>("/roles/master-permissions")
      .then((response) => active && setGroups(Array.isArray(response.data) ? response.data : []))
      .catch(() => active && setError("Daftar permission gagal dimuat."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);
  const keys = useMemo(() => new Set(selected.map((item) => `${item.model}:${item.action}`)), [selected]);
  const toggle = (permission: Permission, checked: boolean) => {
    const key = `${permission.model}:${permission.action}`;
    setSelected((current) => checked
      ? (keys.has(key) ? current : [...current, permission])
      : current.filter((item) => `${item.model}:${item.action}` !== key));
  };
  const toggleGroup = (permissions: Permission[], checked: boolean) => {
    const groupKeys = new Set(permissions.map((item) => `${item.model}:${item.action}`));
    setSelected((current) => {
      const remaining = current.filter((item) => !groupKeys.has(`${item.model}:${item.action}`));
      return checked ? [...remaining, ...permissions] : remaining;
    });
  };
  return (
    <div className="space-y-3 sm:col-span-2">
      {loading ? <p className="text-sm text-zinc-500">Memuat permission...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
      {groups.map((group) => {
        const all = group.permissions.length > 0 && group.permissions.every((item) => keys.has(`${item.model}:${item.action}`));
        return <section key={group.title} className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="font-semibold">{group.title.replace(/ Permission$/, "")}</h4>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={all} onChange={(event) => toggleGroup(group.permissions, event.target.checked)} /> Pilih semua</label>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {group.permissions.map((permission) => {
              const key = `${permission.model}:${permission.action}`;
              return <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={keys.has(key)} onChange={(event) => toggle(permission, event.target.checked)} /> {permission.action}</label>;
            })}
          </div>
        </section>;
      })}
      </div>
      {required && selected.length === 0 ? <input required aria-label={name} tabIndex={-1} className="sr-only" /> : null}
      {selected.map((permission) => <input key={`${permission.model}:${permission.action}`} type="hidden" name={name} value={JSON.stringify(permission)} />)}
    </div>
  );
}
