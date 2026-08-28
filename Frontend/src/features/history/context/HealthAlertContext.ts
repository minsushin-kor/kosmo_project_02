import { createContext } from 'react'
import type { HealthAlert } from '../api/healthHistoryApi'

export type HealthAlertContextValue = {
  alerts: HealthAlert[]
  unreadCount: number
  isLoading: boolean
  error: string
  markAlertRead: (alertId: number) => Promise<void>
  markAllAlertsRead: () => Promise<void>
}

export const HealthAlertContext = createContext<HealthAlertContextValue | null>(null)
