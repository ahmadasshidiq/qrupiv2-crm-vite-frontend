import { BackendModuleFormPage } from "@/components/backend-module-form-page";
import { useAnnouncementsPageConfig } from "./use-announcements-page-config";

type AnnouncementFormPageProps = {
  mode: "create" | "edit" | "view";
};

export default function AnnouncementFormPage({ mode }: AnnouncementFormPageProps) {
  const config = useAnnouncementsPageConfig();
  return <BackendModuleFormPage config={config} mode={mode} />;
}
