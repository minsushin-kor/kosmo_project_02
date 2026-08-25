import { afterEach, describe, expect, it, vi } from 'vitest'

import { streamChat } from './chatbotApi'
import { clearAuthToken, saveAuthToken } from '../../../shared/auth/authTokenStorage'

describe('streamChat', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    clearAuthToken()
  })

  it('same-origin 경로에 POST JSON을 보내고 SSE token과 source를 처리한다', async () => {
    saveAuthToken('jwt-token', false)
    const encoder = new TextEncoder()
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"type":"token","content":"안녕"}\n\n'))
        controller.enqueue(encoder.encode(
          'data: {"type":"done","sources":[{"title":"건강 가이드","category":"wellness"}]}\n\n',
        ))
        controller.close()
      },
    })
    const fetchMock = vi.fn().mockResolvedValue(new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    }))
    vi.stubGlobal('fetch', fetchMock)
    const onDelta = vi.fn()
    const onSources = vi.fn()
    const onComplete = vi.fn()

    await streamChat(
      { message: '산책량이 적당한가요?', species: 'DOG' },
      { onDelta, onSources, onComplete },
      new AbortController().signal,
    )

    expect(fetchMock).toHaveBeenCalledWith('/api/ai/chat/stream', expect.objectContaining({
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
        Authorization: 'Bearer jwt-token',
      },
      body: JSON.stringify({ message: '산책량이 적당한가요?', species: 'DOG' }),
    }))
    expect(onDelta).toHaveBeenCalledWith('안녕')
    expect(onSources).toHaveBeenCalledWith([
      { title: '건강 가이드', category: 'wellness', sourceId: undefined, score: undefined },
    ])
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('전달받은 AbortSignal을 streaming fetch에 그대로 사용한다', async () => {
    saveAuthToken('jwt-token', true)
    const fetchMock = vi.fn().mockImplementation((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      }))
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()

    const request = streamChat(
      { message: '중단 테스트', species: 'DOG' },
      { onDelta: vi.fn(), onSources: vi.fn(), onComplete: vi.fn() },
      controller.signal,
    )
    controller.abort()

    await expect(request).rejects.toMatchObject({ name: 'AbortError' })
    expect(fetchMock).toHaveBeenCalledWith('/api/ai/chat/stream', expect.objectContaining({
      signal: controller.signal,
    }))
  })

  it('token이 없으면 FastAPI 요청을 시작하지 않는다', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(streamChat(
      { message: '질문', species: 'DOG' },
      { onDelta: vi.fn(), onSources: vi.fn(), onComplete: vi.fn() },
      new AbortController().signal,
    )).rejects.toThrow('로그인이 필요한 기능입니다.')

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
