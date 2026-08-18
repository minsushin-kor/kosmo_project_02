import { apiRequest } from '../../../shared/api/apiClient'

export type SkinCondition = 'NORMAL' | 'REDNESS' | 'DRY' | 'RASH' | 'OTHER'
export type AppetiteLevel = 'NORMAL' | 'DECREASED' | 'INCREASED'
export type WaterIntakeLevel = 'NORMAL' | 'DECREASED' | 'INCREASED'
export type ActivityLevel = 'NORMAL' | 'LOW' | 'HIGH'

export type QuestionnaireRequest = {
  temperature: number
  heartRate: number
  respiratoryRate: number
  skinCondition: SkinCondition
  itching: boolean
  hairLoss: boolean
  vomiting: boolean
  diarrhea: boolean
  appetiteLevel: AppetiteLevel
  waterIntakeLevel: WaterIntakeLevel
  activityLevel: ActivityLevel
  symptomDurationDays: number
  additionalSymptoms: string
}

export type QuestionnaireResponse = QuestionnaireRequest & {
  questionnaireId: number
  petId: number
  submittedAt: string
}

export function createQuestionnaire(petId: string, request: QuestionnaireRequest) {
  return apiRequest<QuestionnaireResponse>(`/pets/${petId}/questionnaires`, {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function getQuestionnaire(questionnaireId: number, signal?: AbortSignal) {
  return apiRequest<QuestionnaireResponse>(`/questionnaires/${questionnaireId}`, { signal })
}

export function getQuestionnaires(petId: string, signal?: AbortSignal) {
  return apiRequest<QuestionnaireResponse[]>(`/pets/${petId}/questionnaires`, { signal })
}
