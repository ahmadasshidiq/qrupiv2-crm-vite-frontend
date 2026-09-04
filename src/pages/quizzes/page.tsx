import { BackendModulePage } from '@/components/backend-module-page'
import { fetchQuizzes } from './actions'
import { QUIZZES_PAGE_CONFIG } from './page.config'
export default function QuizzesPage() { return <BackendModulePage config={QUIZZES_PAGE_CONFIG} fetchPage={fetchQuizzes} /> }
