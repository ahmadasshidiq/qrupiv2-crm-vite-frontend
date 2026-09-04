import { BackendModulePage } from '@/components/backend-module-page'
import { fetchAttendances } from './actions'
import { ATTENDANCES_PAGE_CONFIG } from './page.config'
export default function AttendancesPage() { return <BackendModulePage config={ATTENDANCES_PAGE_CONFIG} fetchPage={fetchAttendances} /> }
