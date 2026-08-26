import { afterEach, describe, expect, it, vi } from 'vitest'
import { signup, updateMe } from './authApi'

describe('authApi', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('회원가입 payload를 Backend 필드로만 전송한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: { userId: 1, loginId: 'guardian', email: 'user@example.com', userName: '보호자', phone: '010-1234-5678', role: 'USER' },
    })))
    vi.stubGlobal('fetch', fetchMock)

    await signup({
      loginId: 'guardian', password: 'password123', email: 'user@example.com', userName: '보호자', phone: '010-1234-5678',
      postalCode: '12345', address: '서울시 강남구', detailAddress: '101호',
    })

    const [, init] = fetchMock.mock.calls[0]
    expect(JSON.parse(init.body as string)).toEqual({
      loginId: 'guardian', password: 'password123', email: 'user@example.com', userName: '보호자', phone: '010-1234-5678',
      postalCode: '12345', address: '서울시 강남구', detailAddress: '101호',
    })
  })

  it('회원정보와 선택적 비밀번호 변경값을 PUT으로 전송한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: { userId: 1, loginId: 'guardian', email: 'new@example.com', userName: '새 보호자', phone: '', role: 'USER' },
    })))
    vi.stubGlobal('fetch', fetchMock)

    await updateMe({
      userName: '새 보호자',
      email: 'new@example.com',
      phone: '',
      currentPassword: 'password123',
      newPassword: 'new-password123',
      postalCode: '12345',
      address: '서울시 강남구',
      detailAddress: '101호',
    })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/auth/me')
    expect(init.method).toBe('PUT')
    expect(JSON.parse(init.body as string)).toMatchObject({
      userName: '새 보호자',
      currentPassword: 'password123',
      newPassword: 'new-password123',
    })
  })
})
