import { fetchPaginated, type PaginationFilters } from "@/lib/api/paginated";
import type { UserRow } from "./types";

export type UserCategory = "staff" | "student";

export async function fetchUsers(
  page: number,
  limit: number,
  category?: UserCategory,
  filters: PaginationFilters = {},
) {
  const filtersForCategory =
    category === "student"
      ? { "u.type": "student" }
      : { "u.type.in": "admin,teacher,staff" };

  return fetchPaginated<UserRow>("/users", page, limit, {
    ...filtersForCategory,
    ...filters,
  });
}
