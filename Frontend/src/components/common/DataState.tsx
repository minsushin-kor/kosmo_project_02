import type { ReactNode } from 'react'
import styles from './DataState.module.css'

type DataStateProps = {
  title: string
  children?: ReactNode
  tone?: 'normal' | 'error'
  action?: ReactNode
  isLoading?: boolean
}

export function DataState({ title, children, tone = 'normal', action, isLoading = false }: DataStateProps) {
  return (
    <section
      className={`${styles.state} ${tone === 'error' ? styles.error : ''}`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      aria-busy={isLoading || undefined}
    >
      <div className={styles.heading}>
        {isLoading && <span className={styles.spinner} aria-hidden="true" />}
        <strong>{title}</strong>
      </div>
      {children && <p>{children}</p>}
      {isLoading && (
        <div className={styles.skeleton} aria-hidden="true">
          <span />
          <span />
        </div>
      )}
      {!isLoading && action}
    </section>
  )
}
