import { Outlet } from 'react-router-dom'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/pages/dashboard/components/app-sidebar'
import { AppHeader } from './app-header'
import { formatLongDate } from '@/lib/helper/date'
import { getAuthUser } from '@/lib/auth/session'

export function AppLayout() {
  const user = getAuthUser()
  const institution = user?.institution
  const header = {
    title: institution?.name ?? 'Qrupi CRM',
    institutionLogoUrl: institution?.file_url ?? institution?.avatar_url ?? undefined,
  }

  return <SidebarProvider>
    <AppSidebar />
    <SidebarInset className="min-w-0 bg-white dark:bg-zinc-950">
      <AppHeader
        {...header}
        eyebrow={formatLongDate(new Date())}
        userName={user?.name ?? 'Pengguna Qrupi'}
        avatarUrl={user?.avatar_url ?? undefined}
      />
      <Outlet />
    </SidebarInset>
  </SidebarProvider>
}
