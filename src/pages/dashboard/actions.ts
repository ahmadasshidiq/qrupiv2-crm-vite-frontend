import { apiRequest } from "@/lib/api/client";
import type { DashboardResponseDto } from "@/lib/dto/dashboard";
export type DashboardFilters = { period: string; startDate: string; endDate: string };
export function fetchDashboard(filters?: DashboardFilters) {
  const params = new URLSearchParams();
  if (filters?.period) params.set("period", filters.period);
  if (filters?.startDate) params.set("start_date", filters.startDate);
  if (filters?.endDate) params.set("end_date", filters.endDate);
  const query = params.toString();
  return apiRequest<DashboardResponseDto>(`/dashboard${query ? `?${query}` : ""}`);
}
