import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { GlobalSearch } from './global-search'

type AppHeaderProps = {
  eyebrow?: string
  title: string
  institutionLogoUrl?: string
  userName?: string
  avatarUrl?: string
}

function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function AppHeader({
  eyebrow,
  title,
  institutionLogoUrl,
  userName = 'Ahmad Ashidiq',
  avatarUrl,
}: AppHeaderProps) {
  return <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/90">
    <SidebarTrigger className="absolute top-1/2 left-0 z-40 hidden size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm hover:bg-zinc-50 lg:inline-flex dark:border-white/10 dark:bg-zinc-900 dark:hover:bg-zinc-800" />
    <div className="mx-auto grid min-h-20 w-full max-w-[1440px] items-center gap-4 px-5 py-3 sm:px-8 lg:grid-cols-[minmax(260px,1fr)_520px_minmax(220px,1fr)] lg:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="shrink-0 lg:hidden" />
        {institutionLogoUrl ? (
          <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-white/10">
            <img src={institutionLogoUrl} alt={`Logo ${title}`} className="size-full object-contain" />
          </span>
        ) : (
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200/70 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800" aria-label={`Logo ${title}`}>
            {getInitials(title)}
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="truncate text-xs font-medium text-blue-600 dark:text-blue-400">{eyebrow}</p>}
          <h1 className="mt-0.5 truncate text-lg font-bold tracking-tight sm:text-xl">{title}</h1>
        </div>
      </div>
      <GlobalSearch />
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="icon-lg" className="rounded-xl" aria-label="Notifikasi"><Bell /></Button>
        <Button
          variant="ghost"
          size="icon-lg"
          className="overflow-hidden rounded-full bg-blue-100 p-0 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200/70 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800 dark:hover:bg-blue-900"
          aria-label={`Buka profil ${userName}`}
        >
          {avatarUrl ? (
            <span className="grid size-full place-items-center bg-white">
              <img src={avatarUrl} alt={`Avatar ${userName}`} className="size-full object-cover" />
            </span>
          ) : (
            getInitials(userName)
          )}
        </Button>
      </div>
    </div>
  </header>
}
