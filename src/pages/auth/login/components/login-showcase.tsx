import crmCollage from "@/assets/login-crm-collage.png";

export function LoginShowcase() {
  return (
    <aside
      className="relative hidden min-h-svh overflow-hidden bg-zinc-50 lg:block"
      aria-label="Tampilan fitur Qrupi CRM"
    >
      <img
        src={crmCollage}
        alt="Kolase antarmuka dashboard Qrupi CRM"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/15 via-transparent to-transparent" />
    </aside>
  );
}
