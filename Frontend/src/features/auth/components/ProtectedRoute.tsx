import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { DataState } from '../../../components/common/DataState'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute() {
  const { currentUser, isAuthLoading } = useAuth()
  const location = useLocation()

  if (isAuthLoading) {
    return <DataState title="로그인 상태를 확인하는 중입니다." isLoading />
  }
  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
