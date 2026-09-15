import { getAuthUser } from "@/lib/auth/session";
import { SelfAttendanceActions } from "./page";

export default function TeacherAttendancePage() {
  const user = getAuthUser();
  return (
    <SelfAttendanceActions
      userId={String(user?.id ?? "")}
      type={String(user?.type ?? "teacher")}
    />
  );
}
