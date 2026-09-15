import LoginPage from "@/pages/auth/login/page";
import DashboardPage from "@/pages/dashboard/page";
import { AppLayout } from "@/components/layout/app-layout";
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AllowedRolesRoute } from "@/components/auth/allowed-roles-route";
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
import { ATTENDANCES_PAGE_CONFIG, ATTENDANCE_CREATE_CONFIG } from "@/pages/attendances/page.config";
import { ABSENCE_REASONS_PAGE_CONFIG } from "@/pages/absence-reasons/page.config";
import { ACTIVITIES_PAGE_CONFIG } from "@/pages/activities/page.config";
import { ACTIVITY_CATEGORIES_PAGE_CONFIG } from "@/pages/activity-categories/page.config";
import { ACTIVITY_ITEMS_PAGE_CONFIG } from "@/pages/activity-items/page.config";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          {moduleFormRoutes("/users", USERS_PAGE_CONFIG)}
          <Route
            path="/institutions"
            element={
              <AllowedRolesRoute
                roles={["owner", "super_admin", "admin", "dinas"]}
              >
                <InstitutionsPage />
              </AllowedRolesRoute>
            }
          />
          {moduleFormRoutes("/institutions", INSTITUTIONS_PAGE_CONFIG)}
          <Route
            path="/roles"
            element={
              <AllowedRolesRoute roles={["owner", "super_admin", "admin"]}>
                <RolesPage />
              </AllowedRolesRoute>
            }
          />
          {moduleFormRoutes("/roles", ROLES_PAGE_CONFIG)}
          <Route path="/learning-groups" element={<LearningGroupsPage />} />
          {moduleFormRoutes("/learning-groups", LEARNING_GROUPS_PAGE_CONFIG)}
          <Route
            path="/learning-group-members"
            element={<LearningGroupMembersPage />}
          />
          {moduleFormRoutes(
            "/learning-group-members",
            LEARNING_GROUP_MEMBERS_PAGE_CONFIG,
          )}
          <Route
            path="/learning-resources"
            element={<LearningResourcesPage />}
          />
          {moduleFormRoutes(
            "/learning-resources",
            LEARNING_RESOURCES_PAGE_CONFIG,
          )}
          <Route path="/quizzes" element={<QuizzesPage />} />
          {moduleFormRoutes("/quizzes", QUIZZES_PAGE_CONFIG)}
          <Route path="/quiz-sessions" element={<QuizSessionsPage />} />
          <Route path="/quiz-sessions/rankings" element={<QuizRankingPage />} />
          {moduleFormRoutes("/quiz-sessions", QUIZ_SESSIONS_PAGE_CONFIG)}
          <Route path="/attendances" element={<AttendancesPage />} />
          <Route path="/attendances/me" element={<TeacherAttendancePage />} />
          <Route
            path="/attendances/create"
            element={<AttendanceCreatePage />}
          />
          {moduleFormRoutes("/attendances", ATTENDANCES_PAGE_CONFIG)}
          <Route path="/absence-reasons" element={<AbsenceReasonsPage />} />
          {moduleFormRoutes("/absence-reasons", ABSENCE_REASONS_PAGE_CONFIG)}
          <Route path="/activities/chart" element={<ActivityChartPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          {moduleFormRoutes("/activities", ACTIVITIES_PAGE_CONFIG)}
          <Route
            path="/activity-categories"
            element={<ActivityCategoriesPage />}
          />
          {moduleFormRoutes(
            "/activity-categories",
            ACTIVITY_CATEGORIES_PAGE_CONFIG,
          )}
          <Route path="/activity-items" element={<ActivityItemsPage />} />
          {moduleFormRoutes("/activity-items", ACTIVITY_ITEMS_PAGE_CONFIG)}
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
  return (
    <>
      <Route
        path={`${path}/create`}
        element={<BackendModuleFormPage config={config} mode="create" />}
      />
      <Route
        path={`${path}/:id/edit`}
        element={<BackendModuleFormPage config={config} mode="edit" />}
      />
      <Route
        path={`${path}/:id/view`}
        element={<BackendModuleFormPage config={config} mode="view" />}
      />
    </>
  );
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
