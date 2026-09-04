import { BackendModulePage } from '@/components/backend-module-page'
import { fetchLearningGroupMembers } from './actions'
import { LEARNING_GROUP_MEMBERS_PAGE_CONFIG } from './page.config'
export default function LearningGroupMembersPage() { return <BackendModulePage config={LEARNING_GROUP_MEMBERS_PAGE_CONFIG} fetchPage={fetchLearningGroupMembers} /> }
