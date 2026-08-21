import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, getApiErrorMessage } from './apiClient'

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('JSON 본문 요청에 Content-Type을 추가하고 응답을 반환한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ petId: 1 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiRequest('/pets', { method: 'POST', body: JSON.stringify({ name: '코코' }) }))
      .resolves.toEqual({ petId: 1 })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [, init] = fetchMock.mock.calls[0]
    expect((init.headers as Headers).get('Content-Type')).toBe('application/json')
  })

  it('204 응답은 JSON 파싱 없이 undefined를 반환한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))

    await expect(apiRequest('/pets/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('백엔드 오류 메시지와 상태 코드를 ApiError로 전달한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: '반려동물을 찾을 수 없습니다.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })))

    const request = apiRequest('/pets/999')
    await expect(request).rejects.toMatchObject({
      name: 'ApiError',
      message: '반려동물을 찾을 수 없습니다.',
      status: 404,
    })
  })
})

describe('getApiErrorMessage', () => {
  it('네트워크 연결 실패를 사용자가 이해할 수 있는 문구로 바꾼다', () => {
    expect(getApiErrorMessage(new TypeError('Failed to fetch'), '기본 오류'))
      .toContain('Spring Boot 서버에 연결하지 못했습니다.')
  })
})
