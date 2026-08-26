import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../../auth/context/AuthContext'
import { MemberProfileEditPage } from './MemberProfileEditPage'

const user = {
  userId: 1,
  name: '보호자',
  username: 'guardian',
  email: 'user@example.com',
  phone: '010-1234-5678',
  postalCode: '12345',
  address: '서울시 강남구',
  detailAddress: '101호',
  role: 'USER' as const,
}

function renderPage(updateProfile = vi.fn().mockResolvedValue(user)) {
  const auth: AuthContextValue = {
    currentUser: user,
    isAuthLoading: false,
    register: vi.fn(),
    login: vi.fn(),
    updateProfile,
    logout: vi.fn(),
  }

  render(
    <MemoryRouter initialEntries={['/mypage/profile']}>
      <AuthContext.Provider value={auth}>
        <Routes>
          <Route path="/mypage/profile" element={<MemberProfileEditPage />} />
          <Route path="/" element={<div>홈 화면</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  )
  return updateProfile
}

describe('MemberProfileEditPage', () => {
  it('회원정보와 DB 주소를 수정해 저장한다', async () => {
    const updateProfile = renderPage()

    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '새 보호자' } })
    fireEvent.change(screen.getByLabelText('상세 주소'), { target: { value: '202호' } })
    fireEvent.click(screen.getByRole('button', { name: '변경사항 저장' }))

    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith({
      userName: '새 보호자',
      email: 'user@example.com',
      phone: '010-1234-5678',
      currentPassword: null,
      newPassword: null,
      postalCode: '12345',
      address: '서울시 강남구',
      detailAddress: '202호',
    }))
    expect(await screen.findByText('홈 화면')).toBeInTheDocument()
  })

  it('새 비밀번호 확인이 다르면 API를 호출하지 않는다', () => {
    const updateProfile = renderPage()

    fireEvent.change(screen.getByLabelText('현재 비밀번호'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'new-password123' } })
    fireEvent.change(screen.getByLabelText('새 비밀번호 확인'), { target: { value: 'different-password' } })
    fireEvent.click(screen.getByRole('button', { name: '변경사항 저장' }))

    expect(screen.getByRole('alert')).toHaveTextContent('새 비밀번호가 서로 일치하지 않습니다.')
    expect(updateProfile).not.toHaveBeenCalled()
  })
})
