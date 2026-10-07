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
};

export type CreateAnnouncementPayload = {
  audience: AnnouncementAudience;
  target_id?: string;
  title: string;
  message: string;
};
