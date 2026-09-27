import { Activity, Building2, GraduationCap, Layers3 } from "lucide-react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

type Item = {
  id?: string;
  name?: string;
  title?: string;
  latitude?: number | string;
  longitude?: number | string;
  lat?: number | string;
  lng?: number | string;
  lon?: number | string;
  student_count?: number;
  total_students?: number;
  students_count?: number;
  activity_count?: number;
  total_activities?: number;
  learning_group_count?: number;
  total_learning_groups?: number;
  value?: number;
};

const fmt = new Intl.NumberFormat("id-ID");

function list(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) if (Array.isArray(data[key])) return data[key] as Item[];
  return [];
}

function Ranking({ title, description, icon: Icon, items, suffix }: { title: string; description: string; icon: typeof Activity; items: Item[]; suffix: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-white/10 dark:bg-white/[.03]">
      <div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"><Icon className="size-4" /></span><div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-xs text-zinc-500">{description}</p></div></div>
      <div className="mt-5 space-y-2">{items.length ? items.slice(0, 5).map((item, index) => <div key={item.id ?? `${item.name}-${index}`} className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-white/5"><span className="flex min-w-0 items-center gap-2 text-sm font-medium"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-blue-100 text-xs text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">{index + 1}</span><span className="truncate">{item.name ?? item.title ?? "Institusi"}</span></span><span className="ml-2 shrink-0 text-xs font-semibold text-blue-600">{fmt.format(Number(item.value ?? 0))} {suffix}</span></div>) : <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-500 dark:border-white/10">Data ranking institusi belum tersedia.</div>}</div>
    </div>
  );
}

function ranked(data: Record<string, unknown>, keys: string[], valueKeys: string[]) {
  const source = list(data, keys).length ? list(data, keys) : list(data, ["institutions", "institution_rankings"]);
  return source.map((item) => ({ ...item, value: valueKeys.reduce((value, key) => value || Number((item as Record<string, unknown>)[key] ?? 0), 0) })).sort((a, b) => b.value - a.value);
}

export function SuperAdminPanels({ data }: { data: Record<string, unknown> }) {
  const locations = list(data, ["institution_locations", "institutions_locations", "institutions"]).flatMap((item) => {
    const latitude = Number(item.latitude ?? item.lat); const longitude = Number(item.longitude ?? item.lng ?? item.lon);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? [{ ...item, latitude, longitude }] : [];
  });
  return <>
    <section className="grid gap-6 lg:grid-cols-3">
      <Ranking title="Top institusi siswa terbanyak" description="Berdasarkan jumlah siswa terdaftar" icon={GraduationCap} items={ranked(data, ["top_institutions_by_students", "institutions_by_students", "top_student_institutions"], ["student_count", "total_students", "students_count"])} suffix="siswa" />
      <Ranking title="Top institusi paling aktif" description="Berdasarkan aktivitas pada periode terpilih" icon={Activity} items={ranked(data, ["top_institutions_by_activity", "top_institutions_by_activities", "most_active_institutions"], ["activity_count", "total_activities"])} suffix="aktivitas" />
      <Ranking title="Top institusi grup terbanyak" description="Berdasarkan jumlah grup pembelajaran" icon={Layers3} items={ranked(data, ["top_institutions_by_learning_groups", "top_institutions_by_groups"], ["learning_group_count", "total_learning_groups"])} suffix="grup" />
    </section>
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-white/10 dark:bg-white/[.03]"><div className="flex items-start justify-between"><div><h2 className="font-semibold">Peta sebaran institusi</h2><p className="mt-1 text-xs text-zinc-500">Lokasi institusi dan jumlah siswa terdaftar</p></div><Building2 className="size-5 text-blue-500" /></div><div className="mt-5 overflow-hidden rounded-xl"><MapContainer center={[-2.5, 118]} zoom={4} className="h-80 w-full" scrollWheelZoom><TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{locations.map((item, index) => { const students = Number(item.student_count ?? item.total_students ?? item.students_count ?? 0); return <CircleMarker key={item.id ?? `${item.name}-${index}`} center={[item.latitude, item.longitude]} radius={Math.max(7, Math.min(18, 7 + students / 100))} pathOptions={{ color: "#1d4ed8", fillColor: "#2563eb", fillOpacity: .75 }}><Popup><strong>{item.name ?? "Institusi"}</strong><br />{fmt.format(students)} siswa</Popup></CircleMarker>; })}</MapContainer></div></section>
  </>;
}
