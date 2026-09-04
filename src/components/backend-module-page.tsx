import { useCallback, useEffect, useMemo, useState } from 'react'
import DynamicPage, { type DefaultColumnFormat } from '@/components/dynamic-page'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api/client'
import type { ApiRecordDto } from '@/lib/dto/api'
import type { PaginatedResult } from '@/lib/api/paginated'
import { Archive, Eye, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { archiveResource, fetchResourceById, updateResource } from '@/lib/api/resource'
import { hasPermission } from '@/lib/auth/session'

export type BackendModuleConfig = {
  endpoint?: string
  model?: string
  title: string
  description: string
  emptyMessage: string
  fields: Array<{ key: string; title: string; type?: 'text' | 'date' }>
  editableFields?: Array<{ key: string; label: string; type?: 'text' | 'number' | 'datetime-local' }>
  multipart?: boolean
}

type BackendModulePageProps = {
  config: BackendModuleConfig
  fetchPage: (page: number, limit: number) => Promise<PaginatedResult<ApiRecordDto>>
}

const ITEMS_PER_PAGE = 10

function readNestedValue(record: ApiRecordDto, path: string) {
  return path.split('.').reduce<unknown>((value, key) => {
    if (!value || typeof value !== 'object') return undefined
    return (value as Record<string, unknown>)[key]
  }, record)
}

export function BackendModulePage({ config, fetchPage }: BackendModulePageProps) {
  const behavior = MODULE_BEHAVIORS[config.title]
  const model = behavior.endpoint.slice(1)
  const canView = hasPermission(model, 'get-by-id')
  const canEdit = hasPermission(model, 'update')
  const canArchive = hasPermission(model, 'delete')
  const [items, setItems] = useState<ApiRecordDto[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<ApiRecordDto | null>(null)
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'archive' | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const result = await fetchPage(currentPage, ITEMS_PER_PAGE)
      setItems(result.items)
      setTotal(result.total)
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Data gagal dimuat.')
    } finally {
      setLoading(false)
    }
  }, [currentPage, fetchPage])

  useEffect(() => {
    const task = window.setTimeout(() => void fetchData(), 0)
    return () => window.clearTimeout(task)
  }, [fetchData])

  const columns = useMemo<DefaultColumnFormat<ApiRecordDto>[]>(() => config.fields.map((field) => ({
    ...field,
    formatter: (_value, record) => {
      const value = readNestedValue(record, field.key)
      if (value === null || value === undefined || value === '') return '-'
      if (field.type === 'date') return new Date(String(value)).toLocaleString('id-ID')
      if (field.key === 'status' || field.key === 'is_active') {
        const active = value === true || value === 'active' || value === 'completed' || value === 'present'
        return <Badge className={active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900' : 'bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/10'}>{typeof value === 'boolean' ? (value ? 'Aktif' : 'Tidak aktif') : String(value)}</Badge>
      }
      if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak'
      return String(value)
    },
  })), [config.fields])

  return <main className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8 lg:px-10">
    <div className="mb-5"><h2 className="text-xl font-bold tracking-tight">{config.title}</h2><p className="mt-1 text-xs text-zinc-500">{config.description}</p></div>
    {errorMessage ? <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"><span>{errorMessage}</span><Button variant="outline" size="sm" onClick={() => void fetchData()}>Coba lagi</Button></div> : null}
    <DynamicPage columns={columns} items={items} total={total} currentPage={currentPage} totalPages={Math.max(1, Math.ceil(total / ITEMS_PER_PAGE))} loading={loading} emptyMessage={config.emptyMessage} onPageChange={setCurrentPage} getRowId={(record, index) => String(record.id ?? index)} renderActions={(record) => <div className="flex justify-end gap-1">
      {canView ? <Button variant="ghost" size="icon-sm" aria-label="Lihat detail" onClick={() => void openRecord(record, 'view')}><Eye /></Button> : null}
      {canEdit ? <Button variant="ghost" size="icon-sm" aria-label="Edit data" onClick={() => void openRecord(record, 'edit')}><Pencil /></Button> : null}
      {canArchive ? <Button variant="ghost" size="icon-sm" className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40" aria-label="Arsipkan data" onClick={() => { setSelectedRecord(record); setDialogMode('archive') }}><Archive /></Button> : null}
    </div>} />
    <RecordDialog mode={dialogMode} record={selectedRecord} config={config} saving={saving} onClose={() => setDialogMode(null)} onSave={saveRecord} onArchive={confirmArchive} />
  </main>

  async function openRecord(record: ApiRecordDto, mode: 'view' | 'edit') {
    setSelectedRecord(record)
    setDialogMode(mode)
    if (!record.id) return
    try { setSelectedRecord(await fetchResourceById(behavior.endpoint, record.id)) } catch { setErrorMessage('Detail data gagal dimuat.') }
  }

  async function saveRecord(values: Record<string, unknown>) {
    if (!selectedRecord?.id) return
    setSaving(true)
    try { await updateResource(behavior.endpoint, selectedRecord.id, values, behavior.multipart); setDialogMode(null); await fetchData() } catch (error) { setErrorMessage(error instanceof ApiError ? error.message : 'Data gagal diperbarui.') } finally { setSaving(false) }
  }

  async function confirmArchive() {
    if (!selectedRecord?.id) return
    setSaving(true)
    try { await archiveResource(behavior.endpoint, selectedRecord.id); setDialogMode(null); await fetchData() } catch (error) { setErrorMessage(error instanceof ApiError ? error.message : 'Data gagal diarsipkan.') } finally { setSaving(false) }
  }
}

function RecordDialog({ mode, record, config, saving, onClose, onSave, onArchive }: { mode: 'view' | 'edit' | 'archive' | null; record: ApiRecordDto | null; config: BackendModuleConfig; saving: boolean; onClose: () => void; onSave: (values: Record<string, unknown>) => Promise<void>; onArchive: () => Promise<void> }) {
  return <Dialog open={Boolean(mode)} onOpenChange={(open) => { if (!open) onClose() }}><DialogContent className="max-w-lg sm:max-w-lg"><DialogTitle>{mode === 'view' ? 'Detail' : mode === 'edit' ? 'Edit' : 'Arsipkan'} {config.title}</DialogTitle><DialogDescription>{mode === 'archive' ? 'Data akan disembunyikan dari daftar aktif dan dapat dipulihkan melalui backend.' : mode === 'edit' ? 'Perbarui data yang diperlukan.' : 'Informasi lengkap data.'}</DialogDescription>
    {mode === 'view' && record ? <dl className="grid max-h-[55vh] gap-3 overflow-y-auto sm:grid-cols-2">{config.fields.map((field) => <div key={field.key} className="rounded-xl bg-zinc-50 p-3 dark:bg-white/5"><dt className="text-[10px] text-zinc-500">{field.title}</dt><dd className="mt-1 break-words text-xs font-medium">{String(readNestedValue(record, field.key) ?? '-')}</dd></div>)}</dl> : null}
    {mode === 'edit' && record ? <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); const formData = new FormData(event.currentTarget); void onSave(Object.fromEntries(formData)) }}>{(config.editableFields ?? MODULE_BEHAVIORS[config.title].fields).map((field) => <div key={field.key} className="grid gap-1.5"><Label htmlFor={`edit-${field.key}`}>{field.label}</Label><Input id={`edit-${field.key}`} name={field.key} type={field.type ?? 'text'} defaultValue={String(readNestedValue(record, field.key) ?? '')} /></div>)}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Batal</Button><Button type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button></div></form> : null}
    {mode === 'archive' ? <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Batal</Button><Button className="bg-amber-600 text-white hover:bg-amber-700" disabled={saving} onClick={() => void onArchive()}>{saving ? 'Mengarsipkan...' : 'Arsipkan'}</Button></div> : null}
  </DialogContent></Dialog>
}

type EditField = { key: string; label: string; type?: 'text' | 'number' | 'datetime-local' }
const MODULE_BEHAVIORS: Record<string, { endpoint: string; multipart?: boolean; fields: EditField[] }> = {
  'Pengguna': { endpoint: '/users', multipart: true, fields: [{ key: 'name', label: 'Nama' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Telepon' }, { key: 'type', label: 'Tipe' }, { key: 'is_active', label: 'Status' }] },
  'Institusi': { endpoint: '/institutions', multipart: true, fields: [{ key: 'name', label: 'Nama institusi' }, { key: 'phone', label: 'Telepon' }, { key: 'address', label: 'Alamat' }, { key: 'website', label: 'Website' }, { key: 'status', label: 'Status' }] },
  'Role & izin': { endpoint: '/roles', fields: [{ key: 'name', label: 'Nama role' }, { key: 'description', label: 'Deskripsi' }] },
  'Grup belajar': { endpoint: '/learning-groups', fields: [{ key: 'name', label: 'Nama grup' }, { key: 'code', label: 'Kode' }, { key: 'level', label: 'Tingkat', type: 'number' }, { key: 'department', label: 'Jurusan/mapel' }, { key: 'academic_year', label: 'Tahun ajaran' }] },
  'Anggota grup': { endpoint: '/learning-group-members', fields: [{ key: 'user_id', label: 'ID pengguna' }, { key: 'learning_group_id', label: 'ID grup belajar' }, { key: 'role_in_group', label: 'Peran dalam grup' }] },
  'Materi belajar': { endpoint: '/learning-resources', multipart: true, fields: [{ key: 'title', label: 'Judul' }, { key: 'description', label: 'Deskripsi' }, { key: 'type', label: 'Tipe' }, { key: 'file_url', label: 'URL file' }] },
  'Kuis': { endpoint: '/quizzes', fields: [{ key: 'title', label: 'Judul kuis' }, { key: 'description', label: 'Deskripsi' }, { key: 'duration_minutes', label: 'Durasi', type: 'number' }] },
  'Sesi kuis': { endpoint: '/quiz-sessions', fields: [{ key: 'status', label: 'Status' }, { key: 'score', label: 'Nilai', type: 'number' }] },
  'Absensi': { endpoint: '/attendance-logs', fields: [{ key: 'status', label: 'Status' }, { key: 'type', label: 'Tipe' }, { key: 'absence_note', label: 'Catatan' }] },
  'Alasan ketidakhadiran': { endpoint: '/attendance-absence-reasons', fields: [{ key: 'name', label: 'Nama alasan' }, { key: 'description', label: 'Deskripsi' }] },
  'Aktivitas': { endpoint: '/activities', fields: [{ key: 'description', label: 'Deskripsi' }, { key: 'point_value', label: 'Poin', type: 'number' }, { key: 'occurred_at', label: 'Waktu', type: 'datetime-local' }, { key: 'platform', label: 'Platform' }] },
  'Kategori aktivitas': { endpoint: '/activity-categories', fields: [{ key: 'name', label: 'Nama kategori' }, { key: 'description', label: 'Deskripsi' }, { key: 'color', label: 'Warna' }] },
  'Jenis aktivitas': { endpoint: '/activity-items', fields: [{ key: 'name', label: 'Nama aktivitas' }, { key: 'description', label: 'Deskripsi' }, { key: 'type', label: 'Tipe' }, { key: 'point_value', label: 'Poin', type: 'number' }, { key: 'period_type', label: 'Periode' }] },
}
