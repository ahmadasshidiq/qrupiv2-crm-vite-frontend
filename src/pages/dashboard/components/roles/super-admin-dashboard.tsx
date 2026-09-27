import type { ReactNode } from "react";

export function SuperAdminDashboard({
  institutionRankings,
  institutionMap,
}: {
  institutionRankings: ReactNode;
  institutionMap: ReactNode;
}) {
  return (
    <>
      {institutionRankings}
      {institutionMap}
    </>
  );
}

