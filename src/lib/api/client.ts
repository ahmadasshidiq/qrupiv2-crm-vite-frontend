import { clearSession, getAccessToken } from '@/lib/auth/session'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1').replace(/\/$/, '')

type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown>
  authenticated?: boolean
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { authenticated = true, body, headers, ...requestOptions } = options
  const token = getAccessToken()
  const requestHeaders = new Headers(headers)

  if (authenticated && token) requestHeaders.set('Authorization', `Bearer ${token}`)
  const normalizedBody = body && !(body instanceof FormData) && typeof body !== 'string'
    ? JSON.stringify(body)
    : body
  if (normalizedBody && !(normalizedBody instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: requestHeaders,
    body: normalizedBody,
  })
  const payload = await response.json().catch(() => null) as { message?: string } | null

  if (!response.ok) {
    if (response.status === 401) clearSession()
    throw new ApiError(payload?.message ?? 'Terjadi kesalahan saat menghubungi server.', response.status)
  }

  return payload as T
}
