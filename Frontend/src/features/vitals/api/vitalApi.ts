import { apiRequest } from '../../../shared/api/apiClient'

export type VitalStatus = 'NORMAL' | 'WATCH' | 'CAUTION' | 'DANGER'

export type VitalRecord = {
  vitalRecordId: number
  petId: number
  temperature: number
  heartRate: number
  respiratoryRate: number
  measuredAt: string
  sourceType: string
  status: VitalStatus
}

export function getLatestVital(petId: string, signal?: AbortSignal) {
  return apiRequest<VitalRecord>(`/pets/${petId}/vitals/latest`, { signal })
}

export function getVitalRecords(petId: string, signal?: AbortSignal) {
  return apiRequest<VitalRecord[]>(`/pets/${petId}/vitals`, { signal })
}
