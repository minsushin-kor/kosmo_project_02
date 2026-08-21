import { apiRequest } from '../../../shared/api/apiClient'

export type HealthAlert = {
  alertId: number
  petId: number
  predictionId: number | null
  alertType: string
  severity: 'WATCH' | 'CAUTION' | 'DANGER'
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export function getHealthAlerts(
  petId: number,
  signal?: AbortSignal,
) {
  return apiRequest<HealthAlert[]>(
    `/pets/${petId}/alerts`,
    { signal },
  )
}

export function markAllHealthAlertsRead(
  petId: number,
) {
  return apiRequest<number>(
    `/pets/${petId}/alerts/read-all`,
    {
      method: 'PATCH',
    },
  )
}

export function markHealthAlertRead(
  alertId: number,
) {
  return apiRequest<HealthAlert>(
    `/alerts/${alertId}/read`,
    {
      method: 'PATCH',
    },
  )
}