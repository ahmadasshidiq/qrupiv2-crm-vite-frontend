import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  canAccessCrm,
  clearSession,
  getAccessToken,
  getAuthUser,
} from "@/lib/auth/session";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const user = getAuthUser();

  if (!getAccessToken() || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!canAccessCrm(user)) {
    clearSession();
    return (
      <Navigate
        to="/login"
        replace
        state={{ error: "Akun siswa tidak memiliki akses ke CRM." }}
      />
    );
  }

  return children;
}
