import { useEffect, useId, useRef, type FormEvent } from 'react'
import type { DiaryStatus } from '../types'
import styles from './DiaryEditorModal.module.css'

type DiaryEditorModalProps = {
  dateLabel: string
  petName: string
  isToday: boolean
  hasExistingEntry: boolean
  status: DiaryStatus | ''
  note: string
  saveMessage: string
  isSaving: boolean
  isDeleting: boolean
  isUnavailable: boolean
  onStatusChange: (status: DiaryStatus) => void
  onNoteChange: (note: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onDelete: () => void
  onRequestClose: () => void
}

export function DiaryEditorModal({
  dateLabel,
  petName,
  isToday,
  hasExistingEntry,
  status,
  note,
  saveMessage,
  isSaving,
  isDeleting,
  isUnavailable,
  onStatusChange,
  onNoteChange,
  onSubmit,
  onDelete,
  onRequestClose,
}: DiaryEditorModalProps) {
  const dialogRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const closeHandlerRef = useRef(onRequestClose)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    closeHandlerRef.current = onRequestClose
  }, [onRequestClose])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeHandlerRef.current()
        return
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
        ))
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [])

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeHandlerRef.current()
      }}
    >
      <section
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <button ref={closeButtonRef} className={styles.closeButton} type="button" onClick={onRequestClose} aria-label="일기장 닫기">×</button>
        <div className={styles.book}>
          <section className={`${styles.page} ${styles.leftPage}`}>
            <div className={styles.pageInner}>
              <p className={styles.eyebrow}>PATPET DAILY DIARY</p>
              <h2 id={titleId}>{dateLabel}</h2>
              <p className={styles.petLine} id={descriptionId}>{petName}의 {isToday ? '오늘' : '이날'} 하루를 남겨 보세요.</p>

              <fieldset disabled={isUnavailable}>
                <legend>{petName}의 {isToday ? '오늘' : '이날'} 상태</legend>
                <div className={styles.statusChoices}>
                  <label className={status === 'GOOD' ? styles.checkedGood : ''}>
                    <input type="radio" name="diaryStatus" value="GOOD" checked={status === 'GOOD'} onChange={() => onStatusChange('GOOD')} />
                    <span aria-hidden="true">●</span> 좋음
                  </label>
                  <label className={status === 'WATCH' ? styles.checkedWatch : ''}>
                    <input type="radio" name="diaryStatus" value="WATCH" checked={status === 'WATCH'} onChange={() => onStatusChange('WATCH')} />
                    <span aria-hidden="true">●</span> 관찰 필요
                  </label>
                </div>
              </fieldset>

            </div>
          </section>

          <section className={`${styles.page} ${styles.rightPage}`}>
            <form className={styles.form} onSubmit={onSubmit}>
              <label className={styles.noteField}>
                <span>{isToday ? `오늘의 ${petName}는 어땠나요?` : `${dateLabel}, ${petName}는 어땠나요?`}</span>
                <textarea
                  disabled={isUnavailable}
                  value={note}
                  maxLength={300}
                  rows={8}
                  onChange={(event) => onNoteChange(event.target.value)}
                  placeholder={`${petName}의 식사, 활동, 수면 등 기억해 두고 싶은 모습을 남겨주세요.`}
                />
                <small>{note.length} / 300자</small>
              </label>

              {saveMessage && <p className={styles.saveMessage} role="status">{saveMessage}</p>}

              <div className={styles.actions}>
                {hasExistingEntry && (
                  <button className={styles.deleteButton} type="button" disabled={isSaving || isDeleting || isUnavailable} onClick={onDelete}>
                    기록 삭제
                  </button>
                )}
                <button className={styles.cancelButton} type="button" disabled={isSaving || isDeleting} onClick={onRequestClose}>닫기</button>
                <button className={styles.saveButton} type="submit" disabled={isSaving || isDeleting || isUnavailable}>
                  {isSaving ? '저장 중…' : hasExistingEntry ? '수정 완료' : '하루 기록하기'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </section>
    </div>
  )
}
