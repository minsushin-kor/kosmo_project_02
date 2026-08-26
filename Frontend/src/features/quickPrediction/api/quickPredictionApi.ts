import { apiRequest } from '../../../shared/api/apiClient'

export type Species = 'DOG' | 'CAT'
export type Level = 'DECREASED' | 'NORMAL' | 'INCREASED'
export type ActivityLevel = 'LOW' | 'NORMAL' | 'HIGH'
export type RiskGrade = 'NORMAL' | 'WATCH' | 'CAUTION' | 'DANGER'

export type QuickPredictionRequest = {
  species: Species
  age: number
  weight: number
  temperature: number
  heartRate: number
  respiratoryRate: number
  skinRedness: boolean
  itching: boolean
  hairLoss: boolean
  vomiting: boolean
  diarrhea: boolean
  appetiteLevel: Level
  waterIntakeLevel: Level
  activityLevel: ActivityLevel
  symptomDurationDays: number
}

export type QuickPredictionResponse = {
  abnormalProbability: number
  riskGrade: RiskGrade
  primaryRiskFactor: string
}

export async function predictHealthRisk(
  request: QuickPredictionRequest,
  signal?: AbortSignal,
) {
  return apiRequest<QuickPredictionResponse>('/ai/quick-predictions', {
    method: 'POST',
    body: JSON.stringify(request),
    signal,
    skipAuth: true,
  })
}
