import { apiRequest } from "@/lib/api/client";
import { fetchPaginated, type PaginationFilters } from "@/lib/api/paginated";
import type {
  ActivityChartQueryDto,
  ActivityChartResponseDto,
} from "@/lib/dto/activity-chart";
import type { ActivityRow } from "./types";
export const fetchActivities = (
  page: number,
  limit: number,
  filters?: PaginationFilters,
) => fetchPaginated<ActivityRow>("/activities", page, limit, filters);

export async function fetchActivityChart(filters: ActivityChartQueryDto = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  const response = await apiRequest<{ data: ActivityChartResponseDto }>(
    `/activities/chart?${params.toString()}`,
  );
  return response.data;
}
