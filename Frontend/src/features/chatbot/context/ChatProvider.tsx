import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { usePets } from '../../pets/hooks/usePets'
import { streamChat } from '../api/chatbotApi'
import type { ChatHistoryMessage, ChatMessage } from '../types'
import { ChatContext, type ChatContextValue } from './ChatContext'

const INTRO_MESSAGE: ChatMessage = {
  id: 'chat-intro',
  role: 'assistant',
  content: '반려동물의 건강과 생활 관리에 대해 궁금한 점을 물어보세요. 보유한 건강 자료를 바탕으로 알기 쉽게 안내해 드릴게요.',
  state: 'complete',
  isIntro: true,
}

type ChatProviderProps = {
  children: ReactNode
}

function createMessageId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export function ChatProvider({ children }: ChatProviderProps) {
  const { selectedPet } = usePets()
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO_MESSAGE])
  const [isStreaming, setIsStreaming] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortControllerRef.current?.abort(), [])

  const sendMessage = useCallback(async (rawMessage: string) => {
    const message = rawMessage.trim()

    if (!message || isStreaming) {
      return
    }

    const userMessage: ChatMessage = {
      id: createMessageId('user'),
      role: 'user',
      content: message,
      state: 'complete',
    }
    const assistantId = createMessageId('assistant')
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      state: 'streaming',
    }
    const history: ChatHistoryMessage[] = messages
      .filter((item) => !item.isIntro && item.state !== 'error' && item.content)
      .slice(-10)
      .map(({ role, content }) => ({ role, content }))

    setMessages((current) => [...current, userMessage, assistantMessage])
    setIsStreaming(true)

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      await streamChat({
        message,
        history,
        pet_context: {
          id: selectedPet.id,
          name: selectedPet.name,
          species: selectedPet.species,
          breed: selectedPet.breed,
        },
      }, {
        onDelta: (text) => {
          setMessages((current) => current.map((item) => (
            item.id === assistantId
              ? { ...item, content: `${item.content}${text}` }
              : item
          )))
        },
        onSources: (sources) => {
          setMessages((current) => current.map((item) => (
            item.id === assistantId ? { ...item, sources } : item
          )))
        },
        onComplete: () => {
          setMessages((current) => current.map((item) => (
            item.id === assistantId
              ? {
                  ...item,
                  content: item.content || '답변을 생성하지 못했습니다. 잠시 후 다시 질문해 주세요.',
                  state: 'complete',
                }
              : item
          )))
        },
      }, controller.signal)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      const errorMessage = error instanceof TypeError
        ? '챗봇 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'
        : error instanceof Error
          ? error.message
          : '챗봇 서버에 연결하지 못했습니다.'

      setMessages((current) => current.map((item) => (
        item.id === assistantId
          ? { ...item, content: errorMessage, state: 'error' }
          : item
      )))
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
      setIsStreaming(false)
    }
  }, [isStreaming, messages, selectedPet])

  const stopGenerating = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setIsStreaming(false)
    setMessages((current) => current.map((item) => (
      item.state === 'streaming'
        ? {
            ...item,
            content: item.content || '답변 생성을 중단했어요.',
            state: 'stopped',
          }
        : item
    )))
  }, [])

  const clearConversation = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setIsStreaming(false)
    setMessages([INTRO_MESSAGE])
  }, [])

  const retryLastQuestion = useCallback(() => {
    const lastQuestion = [...messages].reverse().find((item) => item.role === 'user')

    if (lastQuestion) {
      void sendMessage(lastQuestion.content)
    }
  }, [messages, sendMessage])

  const value = useMemo<ChatContextValue>(() => ({
    messages,
    isStreaming,
    sendMessage,
    stopGenerating,
    clearConversation,
    retryLastQuestion,
  }), [clearConversation, isStreaming, messages, retryLastQuestion, sendMessage, stopGenerating])

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
