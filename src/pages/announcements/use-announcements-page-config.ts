import { useMemo } from "react";
import { getAuthUser, getRoleName } from "@/lib/auth/session";
import { getAnnouncementsPageConfig } from "./page.config";

export function useAnnouncementsPageConfig() {
  const user = getAuthUser();
  const role = getRoleName(user);
  const userId = user?.id;
  return useMemo(
    () => getAnnouncementsPageConfig(role, userId),
    [role, userId],
  );
}
