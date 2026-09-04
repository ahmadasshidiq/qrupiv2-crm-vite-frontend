import { BackendModulePage } from '@/components/backend-module-page'
import { fetchAbsenceReasons } from './actions'
import { ABSENCE_REASONS_PAGE_CONFIG } from './page.config'
export default function AbsenceReasonsPage() { return <BackendModulePage config={ABSENCE_REASONS_PAGE_CONFIG} fetchPage={fetchAbsenceReasons} /> }
