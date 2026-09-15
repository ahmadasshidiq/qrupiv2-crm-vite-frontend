import { ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";
import qrupiLogo from "@/assets/qrupi-logo.png";
import qrupiLogoWhite from "@/assets/qrupi-logo-white.png";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { INSIGHT_NAVIGATION, MAIN_NAVIGATION } from "../page.config";
import type { NavigationItem } from "../types";
import { getAuthUser, getRoleName, clearSession } from "@/lib/auth/session";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";

export function AppSidebar() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const navigate = useNavigate();
  const isSelfAttendance = ["teacher", "staff"].includes(
    String(getAuthUser()?.type ?? "").toLowerCase(),
  );
  const insightNavigation = INSIGHT_NAVIGATION.map((item) =>
    item.label === "Absensi"
      ? {
          ...item,
          href: isSelfAttendance ? "/attendances/me" : item.href,
          children: item.children?.map((child) =>
            child.label === "Guru" && isSelfAttendance
              ? { ...child, href: "/attendances/me" }
              : child,
          ),
        }
      : item,
  );

  function logout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-zinc-200/80 bg-white dark:border-white/10 dark:bg-slate-900"
    >
      <SidebarHeader className="relative h-20 shrink-0 p-0">
        <a
          href="/dashboard"
          className="ml-5 mt-6 absolute inset-0 flex group-data-[collapsible=icon]:hidden"
        >
          <img
            src={isDark ? qrupiLogoWhite : qrupiLogo}
            alt="Qrupi"
            className="block h-auto w-24 object-contain object-center"
          />
        </a>
        <a
          href="/dashboard"
          className="absolute top-[3rem] right-0 left-0 hidden items-center justify-center group-data-[collapsible=icon]:flex"
          aria-label="Dashboard Qrupi"
        >
          <img
            src={isDark ? "/logo-id-white.png" : "/logo-id.png"}
            alt="Qrupi"
            className="size-5 object-contain"
          />
        </a>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4 group-data-[collapsible=icon]:px-0">
        <NavigationGroup label="Workspace" items={MAIN_NAVIGATION} />
        <NavigationGroup label="Insight & sistem" items={insightNavigation} />
      </SidebarContent>
      <SidebarFooter className="border-t border-zinc-200/70 p-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0 dark:border-white/10">
        <ThemeToggle />
        <Button
          variant="ghost"
          className="mb-2 h-11 w-full justify-start gap-3 rounded-xl px-2 text-zinc-500 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 dark:text-red-400 hover:bg-red-50 dark:hover:text-red-300"
          onClick={logout}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg">
            <LogOut className="size-4 text-red-500" />
          </span>
          <span className="group-data-[collapsible=icon]:hidden text-red-500">
            Keluar
          </span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

function NavigationGroup({
  label,
  items,
}: {
  label: string;
  items: NavigationItem[];
}) {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { state, isMobile } = useSidebar();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );
  const currentHref = `${pathname}${search}`;
  const role = getRoleName(getAuthUser());
  const visibleItems = items.filter(
    (item) =>
      !item.roles ||
      item.roles.some((allowedRole) => role.includes(allowedRole)),
  );

  if (visibleItems.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-3 text-[10px] tracking-wider text-zinc-400 uppercase">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visibleItems.map(
            ({ label: itemLabel, href, icon: Icon, badge, children }) => {
              const hasChildren = Boolean(children?.length);
              const childIsActive =
                children?.some((child) => child.href === currentHref) ?? false;
              const isExpanded = expandedItems[itemLabel] ?? childIsActive;

              return (
                <SidebarMenuItem key={itemLabel}>
                  {hasChildren ? (
                    <SidebarMenuButton
                      isActive={childIsActive}
                      tooltip={itemLabel}
                      aria-expanded={isExpanded}
                      onClick={() => {
                        if (state === "collapsed" && !isMobile) {
                          navigate(href);
                          return;
                        }
                        setExpandedItems((current) => ({
                          ...current,
                          [itemLabel]: !isExpanded,
                        }));
                      }}
                      className="h-10 rounded-xl px-3 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700 dark:data-[active=true]:bg-blue-950/50 dark:data-[active=true]:text-blue-300"
                    >
                      <Icon />
                      <span>{itemLabel}</span>
                      <ChevronDown
                        className={`ml-auto size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      render={<Link to={href} />}
                      isActive={href === currentHref || href === pathname}
                      tooltip={itemLabel}
                      className="h-10 rounded-xl px-3 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700 dark:data-[active=true]:bg-blue-950/50 dark:data-[active=true]:text-blue-300"
                    >
                      <Icon />
                      <span>{itemLabel}</span>
                    </SidebarMenuButton>
                  )}
                  {badge && (
                    <SidebarMenuBadge className="bg-blue-100 text-[9px] text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {badge}
                    </SidebarMenuBadge>
                  )}
                  {hasChildren && isExpanded && (
                    <SidebarMenuSub>
                      {children?.map(
                        ({
                          label: childLabel,
                          href: childHref,
                          icon: ChildIcon,
                        }) => (
                          <SidebarMenuSubItem key={childHref}>
                            <SidebarMenuSubButton
                              render={<Link to={childHref} />}
                              isActive={childHref === currentHref}
                              className="h-9 rounded-lg data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700 dark:data-[active=true]:bg-blue-950/50 dark:data-[active=true]:text-blue-300"
                            >
                              <ChildIcon className="size-4" />
                              <span>{childLabel}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ),
                      )}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              );
            },
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
