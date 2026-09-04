import { BackendModulePage } from '@/components/backend-module-page'
import { fetchRoles } from './actions'
import { ROLES_PAGE_CONFIG } from './page.config'
export default function RolesPage() { return <BackendModulePage config={ROLES_PAGE_CONFIG} fetchPage={fetchRoles} /> }
