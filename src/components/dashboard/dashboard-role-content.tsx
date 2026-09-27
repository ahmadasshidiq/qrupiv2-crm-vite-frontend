import type { ReactNode } from "react";

export type DashboardRoleContentProps = {
  role: string | null;
  superAdmin: ReactNode;
  adminInstitusi: ReactNode;
  pelajar: ReactNode;
  defaultContent: ReactNode;
};

/** Selects the role-specific dashboard section while keeping page orchestration separate. */
export function DashboardRoleContent({
  role,
  superAdmin,
  adminInstitusi,
  pelajar,
  defaultContent,
}: DashboardRoleContentProps) {
  if (role === "Super Admin") return <>{superAdmin}</>;
  if (role === "Admin Institusi") return <>{adminInstitusi}</>;
  if (role === "Pelajar") return <>{pelajar}</>;
  return <>{defaultContent}</>;
}

