import { apiRequest } from "@/lib/api/client";
import type {
  AnnouncementDto,
  CreateAnnouncementPayload,
} from "@/lib/dto/announcement";

export async function fetchAnnouncements() {
  const response = await apiRequest<{ data?: AnnouncementDto[] }>(
    "/notifications/announcements",
  );
  return Array.isArray(response.data) ? response.data : [];
}

export function createAnnouncement(payload: CreateAnnouncementPayload) {
  return apiRequest<{ data: string; message: string }>(
    "/notifications/announcements",
    { method: "POST", body: payload },
  );
}
