import { afterEach, describe, expect, it, vi } from 'vitest'

import { streamChat } from './chatbotApi'

describe('streamChat', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('same-origin 경로에 POST JSON을 보내고 SSE token과 source를 처리한다', async () => {
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

    expect(fetchMock).toHaveBeenCalledWith('/ai/chat/stream', expect.objectContaining({
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: '산책량이 적당한가요?', species: 'DOG' }),
    }))
    expect(onDelta).toHaveBeenCalledWith('안녕')
    expect(onSources).toHaveBeenCalledWith([
      { title: '건강 가이드', category: 'wellness', sourceId: undefined, score: undefined },
    ])
    expect(onComplete).toHaveBeenCalledOnce()
  })
})
