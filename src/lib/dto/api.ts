export type ApiListResponseDto<T> = {
  data?: T[] | { data?: T[]; items?: T[]; total?: number; meta?: { total?: number; totalData?: number } }
  items?: T[]
  total?: number
  meta?: { total?: number; totalData?: number }
}

export type ApiRecordDto = Record<string, unknown> & {
  id?: string
  name?: string
  title?: string
  email?: string
  status?: string
  is_active?: string | boolean
  created_at?: string
  updated_at?: string
}
