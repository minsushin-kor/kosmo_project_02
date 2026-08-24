import { afterEach, describe, expect, it, vi } from 'vitest'
import { signup } from './authApi'

describe('authApi', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('회원가입 payload를 Backend 필드로만 전송한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: { userId: 1, loginId: 'guardian', email: 'user@example.com', userName: '보호자', phone: '010-1234-5678', role: 'USER' },
    })))
    vi.stubGlobal('fetch', fetchMock)

    await signup({ loginId: 'guardian', password: 'password123', email: 'user@example.com', userName: '보호자', phone: '010-1234-5678' })

    const [, init] = fetchMock.mock.calls[0]
    expect(JSON.parse(init.body as string)).toEqual({
      loginId: 'guardian', password: 'password123', email: 'user@example.com', userName: '보호자', phone: '010-1234-5678',
    })
    expect(init.body).not.toContain('address')
  })
})
