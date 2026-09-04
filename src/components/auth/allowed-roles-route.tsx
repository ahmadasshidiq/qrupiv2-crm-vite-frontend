import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getAuthUser, getRoleName } from '@/lib/auth/session'

export function AllowedRolesRoute({ roles, children }: { roles: string[]; children: ReactNode }) {
  const role = getRoleName(getAuthUser())
  return roles.some((allowedRole) => role.includes(allowedRole)) ? children : <Navigate to="/dashboard" replace />
}
