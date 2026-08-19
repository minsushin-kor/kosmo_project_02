import { createBrowserRouter } from 'react-router-dom'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { HealthDiaryPage } from '../features/diary/pages/HealthDiaryPage'
import { NotFoundPage } from '../features/errors/pages/NotFoundPage'
import { HealthHistoryPage } from '../features/history/pages/HealthHistoryPage'
import { LandingPage } from '../features/landing/pages/LandingPage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { SignupPage } from '../features/auth/pages/SignupPage'
import { MyPage } from '../features/profile/pages/MyPage'
import { PredictionResultPage } from '../features/predictions/pages/PredictionResultPage'
import { PetListPage } from '../features/pets/pages/PetListPage'
import { PetEditPage } from '../features/pets/pages/PetEditPage'
import { PetRegisterPage } from '../features/pets/pages/PetRegisterPage'
import { QuestionnairePage } from '../features/questionnaire/pages/QuestionnairePage'
import { QuickPredictionPage } from '../features/quickPrediction/pages/QuickPredictionPage'
import { ReportDetailPage } from '../features/reports/pages/ReportDetailPage'
import { ReportsListPage } from '../features/reports/pages/ReportsListPage'
import { VitalMonitoringPage } from '../features/vitals/pages/VitalMonitoringPage'
import { MainLayout } from '../layouts/MainLayout'

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/mypage', element: <MyPage /> },
      { path: '/quick-prediction', element: <QuickPredictionPage /> },
      { path: '/pets', element: <PetListPage /> },
      { path: '/pets/new', element: <PetRegisterPage /> },
      { path: '/pets/:petId/edit', element: <PetEditPage /> },
      { path: '/pets/:petId/vitals', element: <VitalMonitoringPage /> },
      { path: '/pets/:petId/questionnaire', element: <QuestionnairePage /> },
      { path: '/pets/:petId/history', element: <HealthHistoryPage /> },
      { path: '/pets/:petId/alerts', element: <HealthHistoryPage /> },
      { path: '/pets/:petId/reports', element: <ReportsListPage /> },
      { path: '/pets/:petId/diary', element: <HealthDiaryPage /> },
      { path: '/predictions/:predictionId', element: <PredictionResultPage /> },
      { path: '/reports/:reportId', element: <ReportDetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
