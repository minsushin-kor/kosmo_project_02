import { useEffect, useId, useRef } from 'react'
import styles from './ConfirmModal.module.css'

type ConfirmModalProps = {
  eyebrow?: string
  closeLabel?: string
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  eyebrow = 'DELETE PET PROFILE',
  closeLabel = '삭제 확인창 닫기',
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = 'hidden'
    cancelButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel()
        return
      }

      if (event.key === 'Tab' && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'),
        )
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
  }, [onCancel])

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel()
        }
      }}
    >
      <section
        ref={modalRef}
        className={styles.modal}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <button className={styles.closeButton} type="button" onClick={onCancel} aria-label={closeLabel}>×</button>
        <span className={styles.warningIcon} aria-hidden="true">!</span>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 id={titleId}>{title}</h2>
        <p className={styles.description} id={descriptionId}>{description}</p>
        <div className={styles.actions}>
          <button ref={cancelButtonRef} className={styles.cancelButton} type="button" onClick={onCancel}>{cancelText}</button>
          <button className={styles.confirmButton} type="button" onClick={onConfirm}>{confirmText}</button>
        </div>
      </section>
    </div>
  )
}
