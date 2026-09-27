import type { ApiRecordDto } from "@/lib/dto/api";

export type LegalDocumentRow = ApiRecordDto & {
  id: string;
  slug: "terms" | "privacy";
  title: string;
  content: string;
  version: string;
  status: "draft" | "published" | "archived";
  effective_date: string;
  updated_at: string;
};
