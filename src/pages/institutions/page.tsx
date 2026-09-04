import { BackendModulePage } from '@/components/backend-module-page'
import { fetchInstitutions } from './actions'
import { INSTITUTIONS_PAGE_CONFIG } from './page.config'
export default function InstitutionsPage() { return <BackendModulePage config={INSTITUTIONS_PAGE_CONFIG} fetchPage={fetchInstitutions} /> }
