import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../context/AuthContext'
import { ProtectedRoute } from './ProtectedRoute'

function renderRoute(currentUser: AuthContextValue['currentUser'], isAuthLoading = false) {
  const value: AuthContextValue = {
    currentUser, isAuthLoading, register: vi.fn(), login: vi.fn(), updateProfile: vi.fn(), logout: vi.fn(),
  }
  return render(<AuthContext.Provider value={value}><MemoryRouter initialEntries={['/dashboard']}><Routes>
    <Route path="/login" element={<div>login-page</div>} />
    <Route element={<ProtectedRoute />}><Route path="/dashboard" element={<div>dashboard-page</div>} /></Route>
  </Routes></MemoryRouter></AuthContext.Provider>)
}

describe('ProtectedRoute', () => {
  it('비로그인 사용자를 login으로 보낸다', () => {
    renderRoute(null)
    expect(screen.getByText('login-page')).toBeInTheDocument()
  })

  it('로그인 사용자의 보호 화면 접근을 허용한다', () => {
    renderRoute({ userId: 1, name: '보호자', username: 'guardian', email: 'user@example.com', phone: '', role: 'USER' })
    expect(screen.getByText('dashboard-page')).toBeInTheDocument()
  })

  it('인증 복원 중에는 redirect하지 않는다', () => {
    renderRoute(null, true)
    expect(screen.getByText('로그인 상태를 확인하는 중입니다.')).toBeInTheDocument()
    expect(screen.queryByText('login-page')).not.toBeInTheDocument()
  })
})
