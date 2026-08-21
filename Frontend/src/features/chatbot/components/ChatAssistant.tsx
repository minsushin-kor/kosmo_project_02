import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { usePets } from '../../pets/hooks/usePets'
import { getPetEmoji } from '../../pets/types'
import { useChat } from '../hooks/useChat'
import type { ChatMessage } from '../types'
import styles from './ChatAssistant.module.css'

type ChatAssistantProps = {
  variant: 'dashboard' | 'floating'
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

const SendIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m4 4 17 8-17 8 3.2-8L4 4Zm3.6 7h8.5L7.3 6.9 7.6 11Zm-.3 6.1 8.8-4.1H7.6l-.3 4.1Z" />
  </svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m6.7 5.3 5.3 5.3 5.3-5.3 1.4 1.4-5.3 5.3 5.3 5.3-1.4 1.4-5.3-5.3-5.3 5.3-1.4-1.4 5.3-5.3-5.3-5.3 1.4-1.4Z" />
  </svg>
)

function MessageBubble({ message, onRetry }: { message: ChatMessage; onRetry: () => void }) {
  return (
    <div className={`${styles.messageRow} ${styles[message.role]}`}>
      {message.role === 'assistant' && (
        <span className={styles.messageAvatar} aria-hidden="true">✦</span>
      )}
      <div className={styles.messageContent}>
        <div className={`${styles.messageBubble} ${message.state === 'error' ? styles.errorBubble : ''}`}>
          {message.content ? <p>{message.content}</p> : (
            <span className={styles.typingDots} aria-label="답변 생성 중">
              <i /><i /><i />
            </span>
          )}
          {message.state === 'error' && (
            <button type="button" className={styles.retryButton} onClick={onRetry}>
              다시 시도
            </button>
          )}
        </div>
        {!!message.sources?.length && (
          <div className={styles.sources} aria-label="답변 참고자료">
            <span>참고자료</span>
            {message.sources.map((source, index) => (
              <span className={styles.sourceChip} key={source.sourceId ?? `${source.title}-${index}`}>
                {source.category ? `${source.category} · ` : ''}{source.title}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function ChatAssistant({ variant, isOpen, onOpen, onClose }: ChatAssistantProps) {
  const { selectedPet } = usePets()
  const {
    messages,
    isStreaming,
    sendMessage,
    stopGenerating,
    clearConversation,
    retryLastQuestion,
  } = useChat()
  const [draft, setDraft] = useState('')
  const messageListRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lastMessageContent = messages.at(-1)?.content
  const suggestions = [
    selectedPet ? `${selectedPet.name}의 오늘 건강 상태를 요약해 줘` : '반려동물의 오늘 건강 상태를 확인하는 방법은?',
    '반려동물의 정상 체온 범위는?',
    '식욕이 줄었을 때 확인할 점은?',
  ]

  useEffect(() => {
    if (!isOpen) {
      return
    }

    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [isOpen, lastMessageContent, messages.length])

  useEffect(() => {
    if (isOpen && variant === 'floating') {
      const focusTimer = window.setTimeout(() => textareaRef.current?.focus(), 220)
      return () => window.clearTimeout(focusTimer)
    }
  }, [isOpen, variant])

  const submitMessage = (message: string) => {
    const nextMessage = message.trim()
    if (!nextMessage || isStreaming) {
      return
    }

    setDraft('')
    void sendMessage(nextMessage)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitMessage(draft)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submitMessage(draft)
    }
  }

  const rootClassName = [
    styles.assistant,
    styles[variant],
    isOpen ? styles.open : styles.closed,
  ].join(' ')

  return (
    <div className={rootClassName}>
      {isOpen && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="챗봇 닫기"
          onClick={onClose}
        />
      )}

      {!isOpen ? (
        <div className={styles.launcherGroup}>
          <button type="button" className={styles.promptBubble} onClick={onOpen}>
            AI에 궁금하신 점이 있나요?
          </button>
          <button type="button" className={styles.launcher} onClick={onOpen} aria-label="펫펄스 AI 챗봇 열기">
            <span className={styles.launcherIcon} aria-hidden="true">✦</span>
            <span className={styles.launcherText}>
              <strong>AI 건강 도우미</strong>
              <small>무엇이든 물어보세요</small>
            </span>
          </button>
        </div>
      ) : (
        <section className={styles.panel} aria-label="펫펄스 AI 건강 도우미">
          <header className={styles.panelHeader}>
            <div className={styles.assistantIdentity}>
              <span className={styles.headerIcon} aria-hidden="true">✦</span>
              <div>
                <strong>AI 건강 도우미</strong>
                <span><i /> RAG 자료 기반 답변</span>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button type="button" onClick={clearConversation}>새 대화</button>
              <button type="button" className={styles.iconButton} onClick={onClose} aria-label="챗봇 숨기기">
                <CloseIcon />
              </button>
            </div>
          </header>

          {selectedPet && (
            <div className={styles.petContext}>
              <span aria-hidden="true">{getPetEmoji(selectedPet.species)}</span>
              <p><strong>{selectedPet.name}</strong>에 대해 질문하고 있어요</p>
            </div>
          )}

          <div className={styles.messageList} ref={messageListRef} aria-live="polite">
            {messages.map((message) => (
              <MessageBubble message={message} onRetry={retryLastQuestion} key={message.id} />
            ))}

            {messages.length === 1 && (
              <div className={styles.suggestions}>
                <span>이렇게 물어보세요</span>
                {suggestions.map((suggestion) => (
                  <button type="button" onClick={() => submitMessage(suggestion)} key={suggestion}>
                    {suggestion}<b aria-hidden="true">↗</b>
                  </button>
                ))}
              </div>
            )}
          </div>

          <form className={styles.composer} onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              maxLength={1000}
              placeholder={selectedPet ? `${selectedPet.name}의 건강에 대해 물어보세요` : '반려동물 건강에 대해 물어보세요'}
              aria-label="챗봇 질문 입력"
            />
            {isStreaming ? (
              <button type="button" className={styles.stopButton} onClick={stopGenerating} aria-label="답변 생성 중지">
                <span />
              </button>
            ) : (
              <button type="submit" className={styles.sendButton} disabled={!draft.trim()} aria-label="질문 보내기">
                <SendIcon />
              </button>
            )}
          </form>
          <p className={styles.disclaimer}>AI 답변은 건강관리 참고용이며 수의사의 진단을 대신하지 않습니다.</p>
        </section>
      )}
    </div>
  )
}
