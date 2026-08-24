import { act, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../hooks/useAuth'
import { AuthProvider } from './AuthProvider'

const apiMocks = vi.hoisted(() => ({ getMe: vi.fn(), login: vi.fn(), signup: vi.fn() }))
vi.mock('../api/authApi', () => ({ getMe: apiMocks.getMe, login: apiMocks.login, signup: apiMocks.signup }))

const user = { userId: 1, name: '보호자', username: 'guardian', email: 'user@example.com', phone: '', role: 'USER' as const }

function Probe() {
  const auth = useAuth()
  return <div>
    <span>{auth.isAuthLoading ? 'loading' : auth.currentUser?.username ?? 'guest'}</span>
    <button onClick={() => { void auth.login('guardian', 'password123', true).catch(() => undefined) }}>login</button>
    <button onClick={auth.logout}>logout</button>
  </div>
}

describe('AuthProvider', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    apiMocks.getMe.mockReset()
    apiMocks.login.mockReset()
  })

  it('/auth/me로 저장된 token 사용자를 복원한다', async () => {
    window.sessionStorage.setItem('petpulse-access-token', 'valid-token')
    apiMocks.getMe.mockResolvedValue(user)
    render(<AuthProvider><Probe /></AuthProvider>)
    expect(await screen.findByText('guardian')).toBeInTheDocument()
    expect(apiMocks.getMe).toHaveBeenCalledOnce()
  })

  it('유효하지 않은 token 복원 실패 시 token과 사용자를 제거한다', async () => {
    window.localStorage.setItem('petpulse-access-token', 'invalid-token')
    apiMocks.getMe.mockRejectedValue(new Error('401'))
    render(<AuthProvider><Probe /></AuthProvider>)
    expect(await screen.findByText('guest')).toBeInTheDocument()
    expect(window.localStorage.getItem('petpulse-access-token')).toBeNull()
  })

  it('로그인 성공은 사용자를 설정하고 logout은 양쪽 token을 제거한다', async () => {
    apiMocks.login.mockResolvedValue({ accessToken: 'signed-token', user })
    render(<AuthProvider><Probe /></AuthProvider>)
    await screen.findByText('guest')
    await act(async () => screen.getByText('login').click())
    expect(await screen.findByText('guardian')).toBeInTheDocument()
    expect(window.localStorage.getItem('petpulse-access-token')).toBe('signed-token')
    window.sessionStorage.setItem('petpulse-access-token', 'duplicate')
    act(() => screen.getByText('logout').click())
    await waitFor(() => expect(screen.getByText('guest')).toBeInTheDocument())
    expect(window.localStorage.getItem('petpulse-access-token')).toBeNull()
    expect(window.sessionStorage.getItem('petpulse-access-token')).toBeNull()
  })

  it('로그인 실패는 사용자와 token을 만들지 않는다', async () => {
    apiMocks.login.mockRejectedValue(new Error('로그인 실패'))
    render(<AuthProvider><Probe /></AuthProvider>)
    await screen.findByText('guest')
    await act(async () => screen.getByText('login').click())
    expect(screen.getByText('guest')).toBeInTheDocument()
    expect(window.localStorage.getItem('petpulse-access-token')).toBeNull()
  })
})
