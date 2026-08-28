import { useContext } from 'react'
import { HealthAlertContext } from '../context/HealthAlertContext'

export function useHealthAlerts() {
  const context = useContext(HealthAlertContext)

  if (!context) {
    throw new Error('useHealthAlerts must be used inside HealthAlertProvider')
  }

  return context
}
