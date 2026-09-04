import type { BackendModuleConfig } from '@/components/backend-module-page'
export const ROLES_PAGE_CONFIG: BackendModuleConfig = { title: 'Role & izin', description: 'Atur role dan permission pengguna CRM.', emptyMessage: 'Belum ada role', fields: [{ key: 'name', title: 'Nama role' }, { key: 'description', title: 'Deskripsi' }, { key: 'updated_at', title: 'Diperbarui', type: 'date' }] }
