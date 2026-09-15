import { DefaultModulePage } from "@/components/backend-module-page";
import { fetchLearningGroupMembers } from "./actions";
import { LEARNING_GROUP_MEMBERS_PAGE_CONFIG } from "./page.config";
export default function LearningGroupMembersPage() {
  return (
    <DefaultModulePage
      config={LEARNING_GROUP_MEMBERS_PAGE_CONFIG}
      fetchPage={fetchLearningGroupMembers}
    />
  );
}
