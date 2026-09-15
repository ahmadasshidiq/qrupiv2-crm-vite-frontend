import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { SEARCH_SUGGESTIONS } from "@/pages/dashboard/page.config";
import { APP_MODULES } from "@/config/modules";
import { getAuthUser, getRoleName } from "@/lib/auth/session";
import { useNavigate } from "react-router-dom";

const TONE_CLASSES = {
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  violet:
    "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  orange:
    "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
  emerald:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
};

export function GlobalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const role = getRoleName(getAuthUser());
  const shortcutLabel = /Mac|iPhone|iPad/i.test(navigator.platform)
    ? "⌘ K"
    : "Ctrl K";
  const searchablePages = useMemo(
    () => [
      ...SEARCH_SUGGESTIONS,
      ...APP_MODULES.filter(
        (resource) =>
          !resource.roles ||
          resource.roles.some((allowedRole) => role.includes(allowedRole)),
      ).map((resource, index) => ({
        label: resource.title,
        description: resource.description,
        category: "Halaman",
        href: resource.href,
        keywords: [resource.singular, "buka", "lihat", "kelola"],
        icon: resource.icon,
        tone: (["blue", "violet", "emerald", "orange"] as const)[index % 4],
      })),
    ],
    [role],
  );
  const suggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return searchablePages.slice(0, 6);
    const queryTokens = normalizedQuery.split(/\s+/);
    return searchablePages.filter(
      ({ label, description, category, keywords }) =>
        queryTokens.every((token) =>
          [label, description, category, ...keywords].some((value) =>
            value.toLowerCase().includes(token),
          ),
        ),
    );
  }, [query, searchablePages]);

  function openSuggestion(href: string) {
    setOpen(false);
    setQuery("");
    navigate(href);
  }

  useEffect(() => {
    function openSearch(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-full items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-100/80 px-3 text-left text-[11px] text-zinc-500 transition hover:border-blue-200 hover:bg-blue-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 truncate">Cari halaman atau fitur...</span>
        <kbd className="hidden rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[9px] text-zinc-400 sm:inline dark:border-white/10 dark:bg-zinc-900">
          {shortcutLabel}
        </kbd>
      </button>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-zinc-950/20 backdrop-blur-sm dark:bg-black/60"
        className="max-h-[min(680px,calc(100dvh-32px))] w-[calc(100%-32px)] max-w-2xl gap-0 overflow-hidden rounded-2xl border border-white/60 bg-white/95 p-0 shadow-2xl shadow-zinc-950/20 ring-0 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/95 sm:max-w-2xl"
      >
        <DialogTitle className="sr-only">Cari halaman atau fitur</DialogTitle>
        <DialogDescription className="sr-only">
          Cari dan buka halaman CRM dengan cepat.
        </DialogDescription>
        <div className="relative border-b border-zinc-100 dark:border-white/10">
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && suggestions[0]) {
                event.preventDefault();
                openSuggestion(suggestions[0].href);
              }
            }}
            placeholder="Contoh: laporan absensi"
            className="h-14 rounded-none border-0 bg-transparent pr-4 pl-11 text-sm shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-[min(460px,calc(100dvh-150px))] overflow-y-auto p-2 sm:p-3">
          {!query && (
            <p className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
              Yang sering dibuka
            </p>
          )}
          {suggestions.length > 0 ? (
            suggestions.map(
              ({ label, description, category, href, icon: Icon, tone }) => (
                <a
                  key={label}
                  href={href}
                  onClick={(event) => {
                    event.preventDefault();
                    openSuggestion(href);
                  }}
                  className="group flex items-center gap-3 rounded-xl p-3 transition hover:bg-zinc-50 dark:hover:bg-white/5"
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-xl ${TONE_CLASSES[tone]}`}
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <strong className="truncate text-xs font-semibold">
                        {label}
                      </strong>
                      <small className="rounded-full bg-zinc-100 px-2 py-0.5 text-[8px] text-zinc-500 dark:bg-white/10">
                        {category}
                      </small>
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-zinc-400">
                      {description}
                    </span>
                  </span>
                  <ArrowRight className="size-4 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
                </a>
              ),
            )
          ) : (
            <div className="px-4 py-10 text-center">
              <p className="text-xs font-semibold">Fitur tidak ditemukan</p>
              <p className="mt-1 text-[10px] text-zinc-400">
                Coba gunakan kata kunci yang berbeda.
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/70 px-4 py-2 text-[9px] text-zinc-400 dark:border-white/10 dark:bg-white/[.03]">
          <span>Ketik untuk memfilter fitur</span>
          <span>Enter untuk membuka</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
