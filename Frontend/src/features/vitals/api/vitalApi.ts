import { apiRequest } from '../../../lib/api'

export type VitalStatus =
    | 'NORMAL'
    | 'WATCH'
    | 'CAUTION'
    | 'DANGER'

export type VitalSourceType =
    | 'DATASET'
    | 'MANUAL'

export type VitalRecordResponse = {
    vitalRecordId: number
    petId: number
    temperature: number
    heartRate: number
    respiratoryRate: number
    measuredAt: string
    sourceType: VitalSourceType
    status: VitalStatus
}

export function getLatestVital(petId: number) {
    return apiRequest<VitalRecordResponse>(
        `/api/pets/${petId}/vitals/latest`,
    )
}

export function getVitals(petId: number) {
    return apiRequest<VitalRecordResponse[]>(
        `/api/pets/${petId}/vitals`,
    )
}