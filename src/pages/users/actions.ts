import { fetchPaginated } from '@/lib/api/paginated'
import type { UserRow } from './types'

export type UserCategory = 'staff' | 'student'

export async function fetchUsers(page: number, limit: number, category?: UserCategory) {
  if (!category) return fetchPaginated<UserRow>('/users', page, limit)

  // GET /users belum menyediakan filter tipe di kontrak API. Ambil seluruh halaman,
  // lalu pisahkan datanya di frontend tanpa mengirim query yang tidak didukung backend.
  const batchSize = 100
  const first = await fetchPaginated<UserRow>('/users', 1, batchSize)
  const pageCount = Math.ceil(first.total / batchSize)
  const remaining = pageCount > 1
    ? await Promise.all(Array.from({ length: pageCount - 1 }, (_, index) => fetchPaginated<UserRow>('/users', index + 2, batchSize)))
    : []
  const allUsers = [first, ...remaining].flatMap((result) => result.items)
  const filtered = allUsers.filter((user) => category === 'student'
    ? String(user.type).toLowerCase() === 'student'
    : String(user.type).toLowerCase() !== 'student')
  const start = (page - 1) * limit

  return { items: filtered.slice(start, start + limit), total: filtered.length }
}
