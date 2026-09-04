import { BackendModulePage } from '@/components/backend-module-page'
import { fetchLearningResources } from './actions'
import { LEARNING_RESOURCES_PAGE_CONFIG } from './page.config'
export default function LearningResourcesPage() { return <BackendModulePage config={LEARNING_RESOURCES_PAGE_CONFIG} fetchPage={fetchLearningResources} /> }
