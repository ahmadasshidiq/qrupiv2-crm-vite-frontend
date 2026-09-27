import { fetchPaginated, type PaginationFilters } from "@/lib/api/paginated";
import type { LegalDocumentRow } from "./types";

export const fetchLegalDocuments = (
  page: number,
  limit: number,
  filters?: PaginationFilters,
) => fetchPaginated<LegalDocumentRow>("/legal-documents", page, limit, filters);
