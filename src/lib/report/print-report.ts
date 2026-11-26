import qrupiLogo from "@/assets/qrupi-logo.png";
import { getAuthUser } from "@/lib/auth/session";
import { escapeHtml } from "@/lib/helper/html";
import { buildPrintReportTemplate } from "./print-report-template";

type PrintReportOptions = {
  title: string;
  period: string;
  content: string;
  extraStyles?: string;
};

function getInstitutionHeader() {
  const institution = getAuthUser()?.institution as
    | (Record<string, unknown> & { name?: string })
    | null
    | undefined;
  return {
    institutionName: escapeHtml(institution?.name ?? "Institusi"),
    institutionAddress: escapeHtml(institution?.address ?? ""),
    institutionPhone: escapeHtml(institution?.phone ?? ""),
    institutionWebsite: escapeHtml(institution?.website ?? ""),
    schoolLogo: escapeHtml(institution?.file_url ?? institution?.avatar_url ?? ""),
  };
}

/** Opens the report in a new window and triggers the browser print (Save as PDF). Returns false when pop-ups are blocked. */
export function openPrintReport({ title, period, content, extraStyles }: PrintReportOptions) {
  const report = window.open("", "_blank", "width=1200,height=800");
  if (!report) return false;
  report.document.write(
    buildPrintReportTemplate({
      ...getInstitutionHeader(),
      title,
      qrupiLogo: escapeHtml(qrupiLogo),
      period,
      content,
      extraStyles,
      generatedAt: new Date().toLocaleString("id-ID"),
    }),
  );
  report.document.close();
  report.focus();
  window.setTimeout(() => report.print(), 300);
  return true;
}
