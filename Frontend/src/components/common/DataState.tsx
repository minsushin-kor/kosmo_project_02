import type { ReactNode } from 'react'
import styles from './DataState.module.css'

type DataStateProps = {
  title: string
  children?: ReactNode
  tone?: 'normal' | 'error'
  action?: ReactNode
}

export function DataState({ title, children, tone = 'normal', action }: DataStateProps) {
  return (
    <section className={`${styles.state} ${tone === 'error' ? styles.error : ''}`} role={tone === 'error' ? 'alert' : 'status'}>
      <strong>{title}</strong>
      {children && <p>{children}</p>}
      {action}
    </section>
  )
}
