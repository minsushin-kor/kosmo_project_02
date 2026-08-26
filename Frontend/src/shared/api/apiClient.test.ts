import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, getApiErrorMessage } from './apiClient'

describe('apiRequest', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })
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

  it('파일 업로드는 브라우저가 multipart 경계를 설정하도록 Content-Type을 추가하지 않는다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))
    vi.stubGlobal('fetch', fetchMock)
    const formData = new FormData()
    formData.append('image', new File(['image'], 'choco.png', { type: 'image/png' }))

    await apiRequest('/pets/1/profile-image', { method: 'POST', body: formData })

    const [, init] = fetchMock.mock.calls[0]
    expect((init.headers as Headers).has('Content-Type')).toBe(false)
    expect(init.body).toBe(formData)
  })

  it('204 응답은 JSON 파싱 없이 undefined를 반환한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))

    await expect(apiRequest('/pets/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('저장된 access token을 Authorization Bearer 헤더에 추가한다', async () => {
    window.sessionStorage.setItem('petpulse-access-token', 'signed-token')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([])))
    vi.stubGlobal('fetch', fetchMock)
    await apiRequest('/pets')
    const [, init] = fetchMock.mock.calls[0]
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer signed-token')
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
