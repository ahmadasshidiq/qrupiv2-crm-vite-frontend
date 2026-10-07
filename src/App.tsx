import LoginPage from "@/pages/auth/login/page";
import DashboardPage from "@/pages/dashboard/page";
import { AppLayout } from "@/components/layout/app-layout";
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import type { ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { getAuthUser, getRoleName, hasPermission } from "@/lib/auth/session";
import UsersPage from "@/pages/users/page";
import InstitutionsPage from "@/pages/institutions/page";
import RolesPage from "@/pages/roles/page";
import LearningGroupsPage from "@/pages/learning-groups/page";
import LearningGroupMembersPage from "@/pages/learning-group-members/page";
import LearningResourcesPage from "@/pages/learning-resources/page";
import QuizzesPage from "@/pages/quizzes/page";
import QuizSessionsPage from "@/pages/quiz-sessions/page";
import AttendancesPage from "@/pages/attendances/page";
import TeacherAttendancePage from "@/pages/attendances/teacher-page";
import StudentAttendanceCreatePage from "@/pages/attendances/student-create-page";
import AbsenceReasonsPage from "@/pages/absence-reasons/page";
import ActivitiesPage from "@/pages/activities/page";
import ActivityChartPage from "@/pages/activities/chart-page";
import QuizRankingPage from "@/pages/quiz-sessions/ranking-page";
import ActivityCategoriesPage from "@/pages/activity-categories/page";
import ActivityItemsPage from "@/pages/activity-items/page";
import { BackendModuleFormPage } from "@/components/backend-module-form-page";
import { USERS_PAGE_CONFIG } from "@/pages/users/page.config";
import { INSTITUTIONS_PAGE_CONFIG } from "@/pages/institutions/page.config";
import { ROLES_PAGE_CONFIG } from "@/pages/roles/page.config";
import { LEARNING_GROUPS_PAGE_CONFIG } from "@/pages/learning-groups/page.config";
import { LEARNING_GROUP_MEMBERS_PAGE_CONFIG } from "@/pages/learning-group-members/page.config";
import { LEARNING_RESOURCES_PAGE_CONFIG } from "@/pages/learning-resources/page.config";
import { QUIZZES_PAGE_CONFIG } from "@/pages/quizzes/page.config";
import { QUIZ_SESSIONS_PAGE_CONFIG } from "@/pages/quiz-sessions/page.config";
import { ATTENDANCES_PAGE_CONFIG, ATTENDANCE_CREATE_CONFIG, ATTENDANCE_STUDENT_EDIT_CONFIG } from "@/pages/attendances/page.config";
import { ABSENCE_REASONS_PAGE_CONFIG } from "@/pages/absence-reasons/page.config";
import { ACTIVITIES_PAGE_CONFIG } from "@/pages/activities/page.config";
import { ACTIVITY_CATEGORIES_PAGE_CONFIG } from "@/pages/activity-categories/page.config";
import { ACTIVITY_ITEMS_PAGE_CONFIG } from "@/pages/activity-items/page.config";
import LegalPage from "@/pages/legal/page";
import LegalDocumentsPage from "@/pages/legal-documents/page";
import { LEGAL_DOCUMENTS_PAGE_CONFIG } from "@/pages/legal-documents/page.config";
import AnnouncementsPage from "@/pages/announcements/page";
import { getAnnouncementsPageConfig } from "@/pages/announcements/page.config";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/terms" element={<LegalPage />} />
        <Route path="/privacy" element={<LegalPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<PermissionRoute model="dashboard" action="get-overview"><DashboardPage /></PermissionRoute>} />
          <Route path="/announcements" element={<PermissionRoute model="notifications"><AnnouncementsPage /></PermissionRoute>} />
          {moduleFormRoutes("/announcements", getAnnouncementsPageConfig(getRoleName(getAuthUser()), getAuthUser()?.id))}
          <Route path="/users" element={<PermissionRoute model="users"><UsersPage /></PermissionRoute>} />
          {moduleFormRoutes("/users", USERS_PAGE_CONFIG)}
          <Route
            path="/institutions"
            element={
              <PermissionRoute model="institutions">
                <InstitutionsPage />
              </PermissionRoute>
            }
          />
          {moduleFormRoutes("/institutions", INSTITUTIONS_PAGE_CONFIG)}
          <Route
            path="/roles"
            element={
              <PermissionRoute model="roles">
                <RolesPage />
              </PermissionRoute>
            }
          />
          {moduleFormRoutes("/roles", ROLES_PAGE_CONFIG)}
          <Route path="/learning-groups" element={<PermissionRoute model="learning-groups"><LearningGroupsPage /></PermissionRoute>} />
          {moduleFormRoutes("/learning-groups", LEARNING_GROUPS_PAGE_CONFIG)}
          <Route
            path="/learning-group-members"
            element={<PermissionRoute model="learning-group-members"><LearningGroupMembersPage /></PermissionRoute>}
          />
          {moduleFormRoutes(
            "/learning-group-members",
            LEARNING_GROUP_MEMBERS_PAGE_CONFIG,
          )}
          <Route
            path="/learning-resources"
            element={<PermissionRoute model="learning-resources"><LearningResourcesPage /></PermissionRoute>}
          />
          {moduleFormRoutes(
            "/learning-resources",
            LEARNING_RESOURCES_PAGE_CONFIG,
          )}
          <Route path="/quizzes" element={<PermissionRoute model="quizzes"><QuizzesPage /></PermissionRoute>} />
          {moduleFormRoutes("/quizzes", QUIZZES_PAGE_CONFIG)}
          <Route path="/quiz-sessions" element={<PermissionRoute model="quiz-sessions"><QuizSessionsPage /></PermissionRoute>} />
          <Route path="/quiz-sessions/rankings" element={<PermissionRoute model="quiz-sessions"><QuizRankingPage /></PermissionRoute>} />
          {moduleFormRoutes("/quiz-sessions", QUIZ_SESSIONS_PAGE_CONFIG)}
          <Route path="/attendances" element={<PermissionRoute model="attendance-logs"><AttendancesPage /></PermissionRoute>} />
          <Route path="/attendances/me" element={<PermissionRoute model="attendance-logs"><TeacherAttendancePage /></PermissionRoute>} />
          <Route
            path="/attendances/create"
            element={<PermissionRoute model="attendance-logs" action="create"><AttendanceCreatePage /></PermissionRoute>}
          />
          {attendanceFormRoutes()}
          <Route path="/absence-reasons" element={<PermissionRoute model="attendance-absence-reasons"><AbsenceReasonsPage /></PermissionRoute>} />
          {moduleFormRoutes("/absence-reasons", ABSENCE_REASONS_PAGE_CONFIG)}
          <Route path="/activities/chart" element={<PermissionRoute model="activities"><ActivityChartPage /></PermissionRoute>} />
          <Route path="/activities" element={<PermissionRoute model="activities"><ActivitiesPage /></PermissionRoute>} />
          {moduleFormRoutes("/activities", ACTIVITIES_PAGE_CONFIG)}
          <Route
            path="/activity-categories"
            element={<PermissionRoute model="activity-categories"><ActivityCategoriesPage /></PermissionRoute>}
          />
          {moduleFormRoutes(
            "/activity-categories",
            ACTIVITY_CATEGORIES_PAGE_CONFIG,
          )}
          <Route path="/activity-items" element={<PermissionRoute model="activity-items"><ActivityItemsPage /></PermissionRoute>} />
          {moduleFormRoutes("/activity-items", ACTIVITY_ITEMS_PAGE_CONFIG)}
          <Route
            path="/legal-documents"
            element={
              <PermissionRoute model="legal-documents">
                <LegalDocumentsPage />
              </PermissionRoute>
            }
          />
          {moduleFormRoutes("/legal-documents", LEGAL_DOCUMENTS_PAGE_CONFIG)}
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function moduleFormRoutes(
  path: string,
  config: import("@/components/backend-module-page").BackendModuleConfig,
) {
  const guard = (element: ReactNode) => element;
  return (
    <>
      <Route
        path={`${path}/create`}
        element={guard(<BackendModuleFormPage config={config} mode="create" />)}
      />
      <Route
        path={`${path}/:id/edit`}
        element={guard(<BackendModuleFormPage config={config} mode="edit" />)}
      />
      <Route
        path={`${path}/:id/view`}
        element={guard(<BackendModuleFormPage config={config} mode="view" />)}
      />
    </>
  );
}

function attendanceFormRoutes() {
  return <>
    <Route path="/attendances/:id/edit" element={<AttendanceEditRoute />} />
    <Route path="/attendances/:id/view" element={<BackendModuleFormPage config={ATTENDANCES_PAGE_CONFIG} mode="view" />} />
  </>;
}

function AttendanceEditRoute() {
  const [searchParams] = useSearchParams();
  return <BackendModuleFormPage config={searchParams.get("category") === "student" ? ATTENDANCE_STUDENT_EDIT_CONFIG : ATTENDANCES_PAGE_CONFIG} mode="edit" />;
}

function PermissionRoute({
  model,
  action,
  children,
}: {
  model: string;
  action?: string;
  children: ReactNode;
}) {
  const allowed = action
    ? hasPermission(model, action)
    : hasPermission(model, "get") || hasPermission(model, "get-all");
  return allowed ? children : <Navigate to="/dashboard" replace />;
}

export default App;

function AttendanceCreatePage() {
  const [searchParams] = useSearchParams();
  if (searchParams.get("category") === "student") {
    return <StudentAttendanceCreatePage />;
  }
  return (
    <BackendModuleFormPage
      config={ATTENDANCE_CREATE_CONFIG}
      mode="create"
      initialValues={{ type: "teacher", status: "on_time", requires_check_out: "true" }}
    />
  );
}
