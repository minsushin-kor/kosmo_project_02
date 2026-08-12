import { createContext } from 'react'
import type { ChatMessage } from '../types'

export type ChatContextValue = {
  messages: ChatMessage[]
  isStreaming: boolean
  sendMessage: (message: string) => Promise<void>
  stopGenerating: () => void
  clearConversation: () => void
  retryLastQuestion: () => void
}

export const ChatContext = createContext<ChatContextValue | null>(null)
