import type { ChatSource, ChatStreamEvent, ChatStreamRequest } from '../types'

type ChatStreamCallbacks = {
  onDelta: (text: string) => void
  onSources: (sources: ChatSource[]) => void
  onComplete: () => void
}

type JsonChatResponse = {
  answer?: string
  content?: string
  message?: string
  items?: ChatSourcePayload[]
  sources?: ChatSourcePayload[]
}

type ChatSourcePayload = {
  source_id?: string
  sourceId?: string
  title?: string
  category?: string
  score?: number
}

const DEFAULT_CHAT_API_URL = 'http://localhost:8000/ai/chat/stream'

function getChatApiUrl() {
  return import.meta.env.VITE_CHAT_API_URL?.trim() || DEFAULT_CHAT_API_URL
}

function normalizeSources(sources: ChatSourcePayload[] = []): ChatSource[] {
  return sources
    .filter((source) => source.title)
    .map((source) => ({
      sourceId: source.source_id ?? source.sourceId,
      title: source.title as string,
      category: source.category,
      score: source.score,
    }))
}

function parsePayload(data: string): ChatStreamEvent | null {
  if (!data || data === '[DONE]') {
    return null
  }

  try {
    return JSON.parse(data) as ChatStreamEvent
  } catch {
    return { type: 'token', content: data }
  }
}

function readEventBlock(block: string) {
  const data: string[] = []

  block.split(/\r?\n/).forEach((line) => {
    if (line.startsWith('data:')) {
      data.push(line.slice(5).trimStart())
    }
  })

  return data.join('\n')
}

export async function streamChat(
  request: ChatStreamRequest,
  callbacks: ChatStreamCallbacks,
  signal: AbortSignal,
) {
  const response = await fetch(getChatApiUrl(), {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
    signal,
  })

  if (!response.ok) {
    let detail = '챗봇 서버에 연결하지 못했습니다.'

    try {
      const errorBody = await response.json() as { detail?: string; message?: string }
      detail = errorBody.detail ?? errorBody.message ?? detail
    } catch {
      // 서버가 JSON 오류를 반환하지 않으면 기본 안내 문구를 사용합니다.
    }

    throw new Error(detail)
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const payload = await response.json() as JsonChatResponse
    const answer = payload.answer ?? payload.content ?? ''

    if (answer) {
      callbacks.onDelta(answer)
    }

    callbacks.onSources(normalizeSources(payload.sources ?? payload.items))
    callbacks.onComplete()
    return
  }

  if (!response.body) {
    throw new Error('스트리밍 응답을 읽을 수 없습니다.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let completed = false

  const processEvent = (block: string) => {
    if (!block.trim()) {
      return
    }

    const data = readEventBlock(block)
    const payload = parsePayload(data)

    if (!payload) {
      return
    }

    if (payload.type === 'token') {
      if (payload.content) {
        callbacks.onDelta(payload.content)
      }
      return
    }

    if (payload.type === 'done') {
      callbacks.onSources(normalizeSources(payload.sources))
      completed = true
      callbacks.onComplete()
      return
    }

    if (payload.type === 'error') {
      throw new Error(payload.message ?? '답변 생성 중 오류가 발생했습니다.')
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value, { stream: !done })

    let boundary = /\r?\n\r?\n/.exec(buffer)
    while (boundary) {
      processEvent(buffer.slice(0, boundary.index))
      buffer = buffer.slice(boundary.index + boundary[0].length)
      boundary = /\r?\n\r?\n/.exec(buffer)
    }

    if (done) {
      break
    }
  }

  processEvent(buffer)

  if (!completed) {
    callbacks.onComplete()
  }
}
