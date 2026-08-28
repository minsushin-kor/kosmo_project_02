import { Link } from 'react-router-dom'
import { useHealthAlerts } from '../hooks/useHealthAlerts'
import styles from './HealthAlertTopButton.module.css'

type HealthAlertTopButtonProps = {
  petId: number
  petName: string
}

export function HealthAlertTopButton({ petId, petName }: HealthAlertTopButtonProps) {
  const { unreadCount, isLoading, error } = useHealthAlerts()
  const count = isLoading || error ? null : unreadCount

  const accessibleCount = count === null
    ? '읽지 않은 알림 수를 확인하지 못했습니다.'
    : count > 0
      ? `읽지 않은 알림 ${count}건이 있습니다.`
      : '새로운 알림이 없습니다.'

  return (
    <Link
      className={styles.alertButton}
      to={`/pets/${petId}/history?tab=alerts`}
      aria-label={`${petName}의 알림. ${accessibleCount}`}
      title={accessibleCount}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
      {count !== null && count > 0 && (
        <span>{count > 99 ? '99+' : count}</span>
      )}
    </Link>
  )
}
