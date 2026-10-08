import { apiRequest } from "@/lib/api/client";
import type {
  AttendanceChartQueryDto,
  AttendanceChartResponseDto,
} from "@/lib/dto/attendance-chart";

export async function fetchAttendanceChart(
  filters: AttendanceChartQueryDto = {},
) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const response = await apiRequest<{ data: AttendanceChartResponseDto }>(
    `/attendance-logs/chart?${params.toString()}`,
  );
  return response.data;
}
