import LoginPage from '@/pages/auth/login/page'
import DashboardPage from '@/pages/dashboard/page'
import { AppLayout } from '@/components/layout/app-layout'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AllowedRolesRoute } from '@/components/auth/allowed-roles-route'
import UsersPage from '@/pages/users/page'
import InstitutionsPage from '@/pages/institutions/page'
import RolesPage from '@/pages/roles/page'
import LearningGroupsPage from '@/pages/learning-groups/page'
import LearningGroupMembersPage from '@/pages/learning-group-members/page'
import LearningResourcesPage from '@/pages/learning-resources/page'
import QuizzesPage from '@/pages/quizzes/page'
import QuizSessionsPage from '@/pages/quiz-sessions/page'
import AttendancesPage from '@/pages/attendances/page'
import AbsenceReasonsPage from '@/pages/absence-reasons/page'
import ActivitiesPage from '@/pages/activities/page'
import ActivityCategoriesPage from '@/pages/activity-categories/page'
import ActivityItemsPage from '@/pages/activity-items/page'

function App() {
  return <BrowserRouter><Routes><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/users" element={<UsersPage />} />
    <Route path="/institutions" element={<AllowedRolesRoute roles={['owner', 'super_admin', 'admin', 'dinas']}><InstitutionsPage /></AllowedRolesRoute>} />
    <Route path="/roles" element={<AllowedRolesRoute roles={['owner', 'super_admin', 'admin']}><RolesPage /></AllowedRolesRoute>} />
    <Route path="/learning-groups" element={<LearningGroupsPage />} />
    <Route path="/learning-group-members" element={<LearningGroupMembersPage />} />
    <Route path="/learning-resources" element={<LearningResourcesPage />} />
    <Route path="/quizzes" element={<QuizzesPage />} />
    <Route path="/quiz-sessions" element={<QuizSessionsPage />} />
    <Route path="/attendances" element={<AttendancesPage />} />
    <Route path="/absence-reasons" element={<AbsenceReasonsPage />} />
    <Route path="/activities" element={<ActivitiesPage />} />
    <Route path="/activity-categories" element={<ActivityCategoriesPage />} />
    <Route path="/activity-items" element={<ActivityItemsPage />} />
  </Route><Route path="*" element={<Navigate to="/login" replace />} /></Routes></BrowserRouter>
}

export default App
