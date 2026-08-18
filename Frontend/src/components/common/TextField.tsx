import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import styles from './TextField.module.css'

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'aria-invalid'> & {
  label: ReactNode
  containerClassName?: string
  hint?: ReactNode
  error?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField({
  id,
  label,
  containerClassName,
  hint,
  error,
  required,
  'aria-describedby': ariaDescribedBy,
  ...inputProps
}, ref) {
  const generatedId = useId()
  const controlId = id ?? generatedId
  const message = error || hint
  const messageId = message ? `${controlId}-description` : undefined
  const describedBy = [ariaDescribedBy, messageId].filter(Boolean).join(' ') || undefined

  return (
    <div className={containerClassName}>
      <label htmlFor={controlId}>
        <span>
          {label}
          {required && <em className={styles.requiredMark} aria-hidden="true">*</em>}
        </span>
      </label>
      <input
        {...inputProps}
        ref={ref}
        id={controlId}
        required={required}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
      />
      {message && <small id={messageId} role={error ? 'alert' : undefined}>{message}</small>}
    </div>
  )
})
