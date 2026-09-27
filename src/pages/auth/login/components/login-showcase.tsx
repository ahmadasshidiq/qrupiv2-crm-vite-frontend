import crmCollage from "@/assets/login-crm-collage.png";

export function LoginShowcase() {
  return (
    <aside
      className="relative hidden min-h-svh overflow-hidden bg-white dark:bg-[#0b1928] lg:block"
      aria-label="Tampilan fitur Qrupi CRM"
    >
      <img
        src={crmCollage}
        alt="Kolase antarmuka dashboard Qrupi CRM"
        className="absolute inset-0 size-full object-cover"
      />
    </aside>
  );
}
