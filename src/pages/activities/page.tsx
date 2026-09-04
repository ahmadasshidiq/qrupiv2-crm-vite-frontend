import { BackendModulePage } from '@/components/backend-module-page'
import { fetchActivities } from './actions'
import { ACTIVITIES_PAGE_CONFIG } from './page.config'
export default function ActivitiesPage() { return <BackendModulePage config={ACTIVITIES_PAGE_CONFIG} fetchPage={fetchActivities} /> }
