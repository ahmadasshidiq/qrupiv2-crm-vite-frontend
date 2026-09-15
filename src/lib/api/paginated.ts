import { apiRequest } from "@/lib/api/client";
import type { ApiListResponseDto, ApiRecordDto } from "@/lib/dto/api";

export type PaginatedResult<T = ApiRecordDto> = { items: T[]; total: number };

export type PaginationFilters = Record<
  string,
  string | number | boolean | null | undefined
>;

export async function fetchPaginated<T = ApiRecordDto>(
  endpoint: string,
  page: number,
  limit: number,
  filters: PaginationFilters = {},
): Promise<PaginatedResult<T>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortOrder: "desc",
  });
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "")
      params.set(key, String(value));
  });
  const payload = await apiRequest<ApiListResponseDto<T>>(
    `${endpoint}?${params}`,
  );
  const nested =
    payload.data && !Array.isArray(payload.data) ? payload.data : null;
  const items = Array.isArray(payload.data)
    ? payload.data
    : (nested?.data ?? nested?.items ?? payload.items ?? []);
  const total =
    payload.total ??
    nested?.total ??
    nested?.meta?.totalData ??
    nested?.meta?.total ??
    payload.meta?.totalData ??
    payload.meta?.total ??
    items.length;
  return { items, total };
}
