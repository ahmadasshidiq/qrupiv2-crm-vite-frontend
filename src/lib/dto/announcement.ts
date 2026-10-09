export type AnnouncementAudience =
  | "user"
  | "learning_group"
  | "institution"
  | "system";

export type AnnouncementDto = {
  id: string;
  audience: AnnouncementAudience;
  target_id?: string | null;
  institution_id?: string | null;
  title: string;
  message: string;
  created_by?: string | null;
  created_at: string;
  send_at?: string | null;
  repeat_type?: "none" | "daily" | "weekly" | "monthly";
  repeat_until?: string | null;
  status?: "scheduled" | "published" | "sent";
};

export type CreateAnnouncementPayload = {
  audience: AnnouncementAudience;
  target_id?: string;
  title: string;
  message: string;
  send_at?: string;
  repeat_type: "none" | "daily" | "weekly" | "monthly";
  repeat_until?: string;
};
