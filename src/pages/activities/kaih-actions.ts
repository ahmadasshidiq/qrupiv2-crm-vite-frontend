import { apiRequest } from "@/lib/api/client";
import type {
  KaihDashboardQueryDto,
  KaihDashboardResponseDto,
} from "@/lib/dto/kaih-dashboard";

export async function fetchKaihDashboard(filters: KaihDashboardQueryDto) {
  const params = new URLSearchParams({
    start_date: filters.start_date,
    end_date: filters.end_date,
  });
  if (filters.learning_group_id) {
    params.set("learning_group_id", filters.learning_group_id);
  }

  const response = await apiRequest<{ data: KaihDashboardResponseDto }>(
    `/activities/kaih-dashboard?${params.toString()}`,
  );
  return response.data;
}
