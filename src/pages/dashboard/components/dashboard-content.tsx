import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getAuthUser, getRoleName } from "@/lib/auth/session";
import { APP_MODULES } from "@/config/modules";

const MODULE_TONES = [
  "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
];

export function DashboardContent() {
  const user = getAuthUser();
  const role = getRoleName(user);
  const visibleResources = APP_MODULES.filter(
    (resource) =>
      !resource.roles ||
      resource.roles.some((candidate) => role.includes(candidate)),
  ).slice(0, 8);

  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8 lg:px-10">
      <section>
        <div>
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
            {user?.name ? `Selamat datang, ${user.name}` : "Selamat datang"}
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">Ringkasan</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Pilih modul untuk mulai mengelola ekosistem Qrupi.
          </p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visibleResources.map(
            ({ href, title, description, icon: Icon }, index) => (
              <Link
                key={href}
                to={href}
                className="group rounded-2xl border border-zinc-200/80 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/5 dark:border-white/10 dark:bg-white/[.03] dark:hover:border-blue-800"
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`grid size-10 place-items-center rounded-xl ${MODULE_TONES[index % MODULE_TONES.length]}`}
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  <ArrowRight className="size-4 text-zinc-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
                </div>
                <h3 className="mt-5 text-sm font-semibold">{title}</h3>
                <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-zinc-500">
                  {description}
                </p>
              </Link>
            ),
          )}
        </div>
      </section>
    </main>
  );
}
