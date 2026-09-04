import { BackendModulePage } from '@/components/backend-module-page'
import { fetchLearningGroups } from './actions'
import { LEARNING_GROUPS_PAGE_CONFIG } from './page.config'
export default function LearningGroupsPage() { return <BackendModulePage config={LEARNING_GROUPS_PAGE_CONFIG} fetchPage={fetchLearningGroups} /> }
