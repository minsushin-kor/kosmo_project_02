import { createBrowserRouter } from 'react-router-dom'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { NotFoundPage } from '../features/errors/pages/NotFoundPage'
import { LandingPage } from '../features/landing/pages/LandingPage'
import { MainLayout } from '../layouts/MainLayout'

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
