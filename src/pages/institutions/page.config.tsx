import type { BackendModuleConfig } from "@/components/backend-module-page";
import { Badge } from "@/components/ui/badge";
import qrupiLogo from "@/assets/qrupi-logo.png";
export const INSTITUTIONS_PAGE_CONFIG: BackendModuleConfig = {
  title: "Institusi",
  description: "Kelola sekolah dan institusi dalam ekosistem Qrupi.",
  emptyMessage: "Belum ada institusi",
  multipart: true,
  editableFields: [
    { key: "name", label: "Nama institusi", required: true, placeholder: "Contoh: SDN Harapan Bangsa" },
    { key: "email", label: "Email", required: true, placeholder: "admin@sekolah.id" },
    { key: "phone", label: "Telepon", placeholder: "Contoh: 0812 3456 7890" },
    { key: "website", label: "Website", placeholder: "https://sekolah.id" },
    { key: "status", label: "Status", options: [{ label: "Aktif", value: "active" }, { label: "Tidak Aktif", value: "inactive" }] },
    { key: "file", label: "Upload logo", type: "file", accept: "image/*", helperText: "Opsional. Pilih file gambar untuk logo institusi." },
    { key: "address", label: "Alamat", type: "textarea", placeholder: "Jl. Merdeka No. 10, Jakarta" },
    { key: "province_code", label: "Provinsi", type: "region", regionLevel: "province", placeholder: "Cari provinsi" },
    { key: "regency_code", label: "Kota/Kabupaten", type: "region", regionLevel: "regency", placeholder: "Pilih provinsi terlebih dahulu" },
    { key: "district_code", label: "Kecamatan", type: "region", regionLevel: "district", placeholder: "Pilih kota/kabupaten terlebih dahulu" },
    { key: "village_code", label: "Kelurahan", type: "region", regionLevel: "village", placeholder: "Pilih kecamatan terlebih dahulu" },
    { key: "zip_code", label: "Kode pos", placeholder: "Contoh: 12140" },
    { key: "country", label: "Negara", placeholder: "Contoh: Indonesia" },
    { key: "latitude", label: "Latitude", type: "number", placeholder: "Contoh: -6.2088" },
    { key: "longitude", label: "Longitude", type: "number", placeholder: "Contoh: 106.8456" },
    { key: "current_subscription_id", label: "ID langganan aktif", placeholder: "Opsional" },
  ],
  actions: {
    view: true,
    create: true,
    edit: true,
    archive: true,
    delete: true,
    filter: true,
    import: true,
    export: true,
  },
  fields: [
    {
      key: "avatar_url",
      title: "Logo",
      formatter: (value) => {
        const logoUrl =
          typeof value === "string" && value.trim() && value !== "-"
            ? value
            : qrupiLogo;

        return (
          <span className="flex size-11 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-1.5 dark:border-white/10 dark:bg-white/[0.04]">
            <img
              src={logoUrl}
              alt="Logo institusi"
              className="size-full object-contain"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = qrupiLogo;
              }}
            />
          </span>
        );
      },
    },
    { key: "name", title: "Nama institusi" },
    { key: "code", title: "Kode" },
    { key: "province_name", title: "Provinsi" },
    { key: "regency_name", title: "Kabupaten/Kota" },
    { key: "phone", title: "Telepon" },
    {
      key: "status",
      title: "Status",
      formatter: (value) => (
        <Badge
          className={
            value
              ? "px-4 py-0 bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900"
              : "px-4 py-0 bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/10"
          }
        >
          {value === "active" ? "Aktif" : "Tidak aktif"}
        </Badge>
      ),
    },
  ],
};
