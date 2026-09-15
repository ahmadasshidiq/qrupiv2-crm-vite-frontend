import { apiRequest } from "@/lib/api/client";
import { fetchPaginated, type PaginationFilters } from "@/lib/api/paginated";
import type { ApiRecordDto } from "@/lib/dto/api";

export type RegionLevel = "province" | "regency" | "district" | "village";

const REGION_ENDPOINTS: Record<RegionLevel, string> = {
  province: "/provinces",
  regency: "/regencies",
  district: "/districts",
  village: "/villages",
};

export function fetchRegions(
  level: RegionLevel,
  filters: PaginationFilters = {},
) {
  return fetchPaginated<ApiRecordDto>(REGION_ENDPOINTS[level], 1, 5, filters);
}

export async function fetchRegionByCode(level: RegionLevel, code: string) {
  const response = await apiRequest<{ data?: ApiRecordDto }>(
    `${REGION_ENDPOINTS[level]}/${code}`,
  );
  return response.data ?? null;
}
