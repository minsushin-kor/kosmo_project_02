import { createBrowserRouter } from 'react-router-dom'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { HealthDiaryPage } from '../features/diary/pages/HealthDiaryPage'
import { NotFoundPage } from '../features/errors/pages/NotFoundPage'
import { FoodRecommendationPage } from '../features/foodRecommendation/pages/FoodRecommendationPage'
import { HealthHistoryPage } from '../features/history/pages/HealthHistoryPage'
import { LandingPage } from '../features/landing/pages/LandingPage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { SignupPage } from '../features/auth/pages/SignupPage'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute'
import { MyPage } from '../features/profile/pages/MyPage'
import { MemberProfileEditPage } from '../features/profile/pages/MemberProfileEditPage'
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
    path: '/lost-pet/:publicToken',
    lazy: async () => {
      const { PublicLostPetPage } = await import('../features/lostPetQr/pages/PublicLostPetPage')
      return { Component: PublicLostPetPage }
    },
  },
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/quick-prediction', element: <QuickPredictionPage /> },
      { path: '/food-recommendation', element: <FoodRecommendationPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/mypage', element: <MyPage /> },
          { path: '/mypage/profile', element: <MemberProfileEditPage /> },
          { path: '/mypage/pets', element: <PetListPage /> },
          {
            path: '/mypage/lost-qr',
            lazy: async () => {
              const { LostPetQrManagementPage } = await import('../features/lostPetQr/pages/LostPetQrManagementPage')
              return { Component: LostPetQrManagementPage }
            },
          },
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
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
