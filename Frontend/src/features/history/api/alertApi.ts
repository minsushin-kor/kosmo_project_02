import { apiRequest } from '../../../lib/api'

export type AlertSeverity =
    | 'WATCH'
    | 'CAUTION'
    | 'DANGER'

export type AlertType =
    | 'VITAL'
    | 'PREDICTION'

export type HealthAlertResponse = {
    alertId: number
    petId: number
    predictionId: number | null
    alertType: AlertType
    severity: AlertSeverity
    title: string
    message: string
    isRead: boolean
    createdAt: string
}

export function getAlerts(petId: number) {
    return apiRequest<HealthAlertResponse[]>(
        `/api/pets/${petId}/alerts`,
    )
}

export function markAlertAsRead(
    alertId: number,
) {
    return apiRequest<HealthAlertResponse>(
        `/api/alerts/${alertId}/read`,
        {
            method: 'PATCH',
        },
    )
}

export function markAllAlertsAsRead(
    petId: number,
) {
    return apiRequest<number>(
        `/api/pets/${petId}/alerts/read-all`,
        {
            method: 'PATCH',
        },
    )
}