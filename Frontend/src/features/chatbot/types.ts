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

export type ChatHistoryMessage = {
  role: ChatRole
  content: string
}

export type ChatPetContext = {
  id: string
  name: string
  species: 'DOG' | 'CAT'
  breed: string
}

export type ChatStreamRequest = {
  message: string
  history: ChatHistoryMessage[]
  pet_context?: ChatPetContext
}
