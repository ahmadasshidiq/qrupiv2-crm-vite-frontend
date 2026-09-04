import { BackendModulePage } from '@/components/backend-module-page'
import { fetchActivityItems } from './actions'
import { ACTIVITY_ITEMS_PAGE_CONFIG } from './page.config'
export default function ActivityItemsPage() { return <BackendModulePage config={ACTIVITY_ITEMS_PAGE_CONFIG} fetchPage={fetchActivityItems} /> }
