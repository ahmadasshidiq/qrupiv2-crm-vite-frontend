import { BackendModulePage } from '@/components/backend-module-page'
import { fetchQuizSessions } from './actions'
import { QUIZ_SESSIONS_PAGE_CONFIG } from './page.config'
export default function QuizSessionsPage() { return <BackendModulePage config={QUIZ_SESSIONS_PAGE_CONFIG} fetchPage={fetchQuizSessions} /> }
