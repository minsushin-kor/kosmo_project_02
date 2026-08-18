export type ChatRole = 'user' | 'assistant'

export type ChatMessageState = 'complete' | 'streaming' | 'error' | 'stopped'

export type ChatSource = {
  sourceId?: string
  title: string
  category?: string
  score?: number
}

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  state: ChatMessageState
  sources?: ChatSource[]
  isIntro?: boolean
}

export type ChatStreamRequest = {
  message: string
  species?: 'DOG' | 'CAT'
}

export type ChatStreamEvent =
  | {
      type: 'token'
      content: string
    }
  | {
      type: 'done'
      sources: ChatSource[]
    }
  | {
      type: 'error'
      message?: string
    }
