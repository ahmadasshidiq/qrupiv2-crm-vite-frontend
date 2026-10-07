import { useMemo } from "react";
import { DefaultModulePage } from "@/components/backend-module-page";
import { getAuthUser, getRoleName } from "@/lib/auth/session";
import { fetchPaginated } from "@/lib/api/paginated";
import type { ApiRecordDto } from "@/lib/dto/api";
import { getAnnouncementsPageConfig } from "./page.config";

export default function AnnouncementsPage() {
  const user = getAuthUser();
  const role = getRoleName(user);
  const config = useMemo(() => getAnnouncementsPageConfig(role, user?.id), [role, user?.id]);
  return <DefaultModulePage config={config} fetchPage={(page, limit, filters) => fetchPaginated<ApiRecordDto>("/notifications/announcements", page, limit, filters)} />;
}
