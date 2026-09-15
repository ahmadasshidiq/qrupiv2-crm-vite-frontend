import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/pages/dashboard/components/app-sidebar";
import { AppHeader } from "./app-header";
import { formatLongDate } from "@/lib/helper/date";
import { getAuthUser, getRoleName } from "@/lib/auth/session";

export function AppLayout() {
  const user = getAuthUser();
  const institution = user?.institution;
  const header = {
    title: institution?.name ?? "Qrupi V2 CRM",
    institutionLogoUrl:
      institution?.file_url ?? institution?.avatar_url ?? undefined,
  };

  useEffect(() => {
    const isSuperAdmin = getRoleName(user) === "super_admin";
    document.title = isSuperAdmin
      ? "Qrupi V2 - CRM"
      : `${institution?.name ?? "Qrupi"} - Qrupi V2 Portal Pelanggan`;
  }, [institution?.name, user]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-white dark:bg-slate-900">
        <AppHeader
          {...header}
          eyebrow={formatLongDate(new Date())}
          userName={user?.name ?? "Pengguna Qrupi"}
          avatarUrl={user?.avatar_url ?? undefined}
        />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
