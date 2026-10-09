import { apiRequest } from "@/lib/api/client";

export type NotificationDto = {
  id: string;
  event_type: string;
  title: string;
  message: string;
  deeplink?: string;
  web_url?: string;
  mobile_route?: string;
  data?: Record<string, unknown>;
  read_at?: string | null;
  created_at: string;
};

export async function fetchUnreadNotificationCount() {
  const response = await apiRequest<{ count?: number }>(
    "/notifications/unread-count",
  );
  return Number(response.count ?? 0);
}

export async function fetchNotifications() {
  const response = await apiRequest<{
    data?: NotificationDto[];
    total?: number;
  }>("/notifications?page=1&limit=20");
  return Array.isArray(response.data) ? response.data : [];
}

export function markNotificationRead(id: string) {
  return apiRequest(`/notifications/announcements/${encodeURIComponent(id)}`, {
    method: "PATCH",
  });
}

export function markAllNotificationsRead() {
  return apiRequest("/notifications/read-all", { method: "PATCH" });
}
