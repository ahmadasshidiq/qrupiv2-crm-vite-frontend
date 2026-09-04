import type { BackendModuleConfig } from '@/components/backend-module-page'
export const ACTIVITY_CATEGORIES_PAGE_CONFIG: BackendModuleConfig = { title: 'Kategori aktivitas', description: 'Kelola kategori aktivitas siswa.', emptyMessage: 'Belum ada kategori aktivitas', fields: [{ key: 'name', title: 'Nama kategori' }, { key: 'description', title: 'Deskripsi' }, { key: 'color', title: 'Warna' }] }
