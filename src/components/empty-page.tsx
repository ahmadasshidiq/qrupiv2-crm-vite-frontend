import type { ReactNode } from "react";

export function EmptyPage({
  title,
  description,
  detail,
  action,
}: {
  title: string;
  description?: string;
  detail?: string | null;
  action?: ReactNode;
}) {
  return (
    <main className="grid min-h-[calc(100vh-4rem)] w-full place-items-center py-10 sm:px-8 lg:px-10">
      <section className="w-full max-w-2xl text-center">
        <h1 className="text-lg font-semibold">{title}</h1>
        {description ? (
          <p className="mt-2 whitespace-nowrap text-sm leading-6 text-zinc-500">{description}</p>
        ) : null}
        {detail ? (
          <p className="mt-3 line-clamp-2 text-xs text-zinc-400">{detail}</p>
        ) : null}
        {action ? <div className="mt-6">{action}</div> : null}
      </section>
    </main>
  );
}
