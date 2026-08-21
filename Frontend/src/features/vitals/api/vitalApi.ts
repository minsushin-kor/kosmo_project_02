import { apiRequest } from '../../../shared/api/apiClient'

export type VitalStatus =
    | 'NORMAL'
    | 'WATCH'
    | 'CAUTION'
    | 'DANGER'

export type VitalSourceType =
    | 'DATASET'
    | 'MANUAL'

export type VitalRecord = {
    vitalRecordId: number
    petId: number
    temperature: number
    heartRate: number
    respiratoryRate: number
    measuredAt: string
    sourceType: VitalSourceType
    status: VitalStatus
}

export type VitalRecordResponse = VitalRecord

export function getLatestVital(
    petId: number,
    signal?: AbortSignal,
) {
    return apiRequest<VitalRecord>(
        `/pets/${petId}/vitals/latest`,
        { signal },
    )
}

export function getVitalRecords(
    petId: number,
    signal?: AbortSignal,
) {
    return apiRequest<VitalRecord[]>(
        `/pets/${petId}/vitals`,
        { signal },
    )
}

export function getVitals(
    petId: number,
    signal?: AbortSignal,
) {
    return getVitalRecords(petId, signal)
}