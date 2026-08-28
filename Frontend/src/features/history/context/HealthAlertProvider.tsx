import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getApiErrorMessage, isAbortError } from '../../../shared/api/apiClient'
import { usePets } from '../../pets/hooks/usePets'
import {
  getHealthAlerts,
  markAllHealthAlertsRead,
  markHealthAlertRead,
  type HealthAlert,
} from '../api/healthHistoryApi'
import { HealthAlertContext, type HealthAlertContextValue } from './HealthAlertContext'

type HealthAlertProviderProps = {
  children: ReactNode
}

export function HealthAlertProvider({ children }: HealthAlertProviderProps) {
  const { selectedPet } = usePets()
  const selectedPetId = selectedPet?.id ?? null
  const [alerts, setAlerts] = useState<HealthAlert[]>([])
  const [alertsPetId, setAlertsPetId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (selectedPetId === null) {
      setAlerts([])
      setAlertsPetId(null)
      setIsLoading(false)
      setError('')
      return
    }

    const controller = new AbortController()
    setAlerts([])
    setAlertsPetId(selectedPetId)
    setIsLoading(true)
    setError('')

    getHealthAlerts(selectedPetId, controller.signal)
      .then(setAlerts)
      .catch((loadError: unknown) => {
        if (isAbortError(loadError)) return
        setAlerts([])
        setError(getApiErrorMessage(loadError, '건강 알림을 불러오지 못했습니다.'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [selectedPetId])

  const markAlertRead = useCallback(async (alertId: number) => {
    const updated = await markHealthAlertRead(alertId)
    setAlerts((current) => current.map(
      (alert) => alert.alertId === updated.alertId ? updated : alert,
    ))
  }, [])

  const markAllAlertsRead = useCallback(async () => {
    if (selectedPetId === null) return
    await markAllHealthAlertsRead(selectedPetId)
    setAlerts((current) => current.map((alert) => ({ ...alert, isRead: true })))
  }, [selectedPetId])

  const visibleAlerts = useMemo(
    () => alertsPetId === selectedPetId ? alerts : [],
    [alerts, alertsPetId, selectedPetId],
  )

  const value = useMemo<HealthAlertContextValue>(() => ({
    alerts: visibleAlerts,
    unreadCount: visibleAlerts.filter((alert) => !alert.isRead).length,
    isLoading: selectedPetId !== null && (isLoading || alertsPetId !== selectedPetId),
    error,
    markAlertRead,
    markAllAlertsRead,
  }), [
    alertsPetId,
    error,
    isLoading,
    markAlertRead,
    markAllAlertsRead,
    selectedPetId,
    visibleAlerts,
  ])

  return (
    <HealthAlertContext.Provider value={value}>
      {children}
    </HealthAlertContext.Provider>
  )
}
