import { DefaultModulePage } from "@/components/backend-module-page";
import { fetchLegalDocuments } from "./actions";
import { LEGAL_DOCUMENTS_PAGE_CONFIG } from "./page.config";

export default function LegalDocumentsPage() {
  return (
    <DefaultModulePage
      config={LEGAL_DOCUMENTS_PAGE_CONFIG}
      fetchPage={fetchLegalDocuments}
    />
  );
}
