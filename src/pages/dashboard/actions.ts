import { apiRequest } from "@/lib/api/client";
import { getAuthUser, getRoleName } from "@/lib/auth/session";
import type { DashboardResponseDto } from "@/lib/dto/dashboard";
export type DashboardFilters = { period: string; startDate: string; endDate: string; learningGroupId?: string; categoryId?: string };

function getDashboardEndpoint() {
  const user = getAuthUser();
  const identity = `${getRoleName(user)} ${user?.type ?? ""}`
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");

  if (identity.includes("super_admin") || identity.includes("owner"))
    return "/dashboard/super-admin";
  if (identity.includes("dinas_pendidikan") || identity.includes("dinas"))
    return "/dashboard/dinas-pendidikan";
  if (
    identity.includes("student") ||
    identity.includes("siswa") ||
    identity.includes("pelajar")
  )
    return "/dashboard/student";
  if (
    identity.includes("instructor") ||
    identity.includes("instruktur") ||
    identity.includes("teacher") ||
    identity.includes("guru")
  )
    return "/dashboard/instructor";
  if (
    identity.includes("institution_admin") ||
    identity.includes("admin_institusi") ||
    identity.includes("admin") ||
    identity.includes("staff") ||
    identity.includes("staf")
  )
    return "/dashboard/institution-admin";

  return "/dashboard";
}

export function fetchDashboard(filters?: DashboardFilters) {
  const params = new URLSearchParams();
  if (filters?.startDate) params.set("start_date", filters.startDate);
  if (filters?.endDate) params.set("end_date", filters.endDate);
  if (filters?.learningGroupId) params.set("learning_group_id", filters.learningGroupId);
  if (filters?.categoryId) params.set("category_id", filters.categoryId);
  const query = params.toString();
  const endpoint = getDashboardEndpoint();
  return apiRequest<DashboardResponseDto>(`${endpoint}${query ? `?${query}` : ""}`);
}
