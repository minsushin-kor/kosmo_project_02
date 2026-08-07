import { useEffect, useRef } from 'react'
import styles from './ConfirmModal.module.css'

type ConfirmModalProps = {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
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
        className={styles.modal}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
      >
        <button className={styles.closeButton} type="button" onClick={onCancel} aria-label="삭제 확인창 닫기">×</button>
        <span className={styles.warningIcon} aria-hidden="true">!</span>
        <p className={styles.eyebrow}>DELETE PET PROFILE</p>
        <h2 id="confirm-modal-title">{title}</h2>
        <p className={styles.description} id="confirm-modal-description">{description}</p>
        <div className={styles.actions}>
          <button ref={cancelButtonRef} className={styles.cancelButton} type="button" onClick={onCancel}>{cancelText}</button>
          <button className={styles.confirmButton} type="button" onClick={onConfirm}>{confirmText}</button>
        </div>
      </section>
    </div>
  )
}
