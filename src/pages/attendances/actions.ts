import { fetchPaginated, type PaginationFilters } from "@/lib/api/paginated";
import type { AttendanceRow } from "./types";

export type AttendanceCategory = "teacher" | "student";

export const fetchAttendances = (
  page: number,
  limit: number,
  category?: AttendanceCategory,
  filters?: PaginationFilters,
) =>
  fetchPaginated<AttendanceRow>("/attendance-logs", page, limit, {
    ...(category ? { "u.type": category } : {}),
    ...filters,
  });

export const fetchMyAttendances = (
  page: number,
  limit: number,
  userId: string,
  filters?: PaginationFilters,
) =>
  fetchPaginated<AttendanceRow>("/attendance-logs", page, limit, {
    "u.id": userId,
    ...filters,
  });
