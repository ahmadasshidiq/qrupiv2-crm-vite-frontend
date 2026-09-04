import { BackendModulePage } from '@/components/backend-module-page'
import { fetchActivityCategories } from './actions'
import { ACTIVITY_CATEGORIES_PAGE_CONFIG } from './page.config'
export default function ActivityCategoriesPage() { return <BackendModulePage config={ACTIVITY_CATEGORIES_PAGE_CONFIG} fetchPage={fetchActivityCategories} /> }
