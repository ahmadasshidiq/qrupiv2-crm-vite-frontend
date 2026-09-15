import { DefaultModulePage } from "@/components/backend-module-page";
import { fetchInstitutions } from "./actions";
import { INSTITUTIONS_PAGE_CONFIG } from "./page.config";
export default function InstitutionsPage() {
  return (
    <DefaultModulePage
      config={INSTITUTIONS_PAGE_CONFIG}
      fetchPage={fetchInstitutions}
    />
  );
}
