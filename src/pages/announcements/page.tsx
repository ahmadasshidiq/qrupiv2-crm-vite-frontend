import { DefaultModulePage } from "@/components/backend-module-page";
import { fetchPaginated } from "@/lib/api/paginated";
import type { ApiRecordDto } from "@/lib/dto/api";
import { useAnnouncementsPageConfig } from "./use-announcements-page-config";

export default function AnnouncementsPage() {
  const config = useAnnouncementsPageConfig();
  return (
    <DefaultModulePage
      config={config}
      fetchPage={(page, limit, filters) =>
        fetchPaginated<ApiRecordDto>(
          "/notifications/announcements",
          page,
          limit,
          filters,
        )
      }
    />
  );
}
