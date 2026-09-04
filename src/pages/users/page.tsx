import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BackendModulePage } from '@/components/backend-module-page'
import { fetchUsers, type UserCategory } from './actions'
import { USERS_PAGE_CONFIG } from './page.config'

export default function UsersPage() {
  const [searchParams] = useSearchParams()
  const category: UserCategory = searchParams.get('category') === 'student' ? 'student' : 'staff'
  const config = useMemo(() => ({
    ...USERS_PAGE_CONFIG,
    title: category === 'student' ? 'Siswa' : 'Guru & Admin',
    description: category === 'student'
      ? 'Kelola akun siswa yang terhubung ke institusi.'
      : 'Kelola akun guru, admin, dan staf institusi.',
    emptyMessage: category === 'student' ? 'Belum ada siswa' : 'Belum ada guru atau admin',
  }), [category])
  const fetchPage = useCallback((page: number, limit: number) => fetchUsers(page, limit, category), [category])

  return <BackendModulePage config={config} fetchPage={fetchPage} />
}
