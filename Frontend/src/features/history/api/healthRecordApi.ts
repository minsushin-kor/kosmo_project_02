import { apiRequest } from '../../../shared/api/apiClient'
import type { HealthPrediction, RiskGrade } from '../../predictions/api/predictionApi'
import type { QuestionnaireResponse } from '../../questionnaire/api/questionnaireApi'

export type HealthRecordStatus = 'ALL' | 'ANALYZED' | 'PENDING'

type HealthRecordSummary = {
  questionnaireId: number
  submittedAt: string
  temperature: number
  heartRate: number
  respiratoryRate: number
  additionalSymptoms: string | null
  analyzed: boolean
  predictionId: number | null
  riskGrade: RiskGrade | null
  abnormalProbability: number | null
}

export type HealthRecordPage = {
  content: HealthRecordSummary[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  unanalyzedCount: number
}

export type HealthRecordDetail = {
  questionnaire: QuestionnaireResponse
  prediction: HealthPrediction | null
}

export function getHealthRecords(
  petId: number,
  page: number,
  size: number,
  status: HealthRecordStatus,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    status,
  })

  return apiRequest<HealthRecordPage>(
    `/pets/${petId}/health-records?${params.toString()}`,
    { signal },
  )
}

export function getHealthRecord(
  questionnaireId: number,
  signal?: AbortSignal,
) {
  return apiRequest<HealthRecordDetail>(
    `/questionnaires/${questionnaireId}/health-record`,
    { signal },
  )
}

export function deleteHealthRecord(questionnaireId: number) {
  return apiRequest<void>(`/questionnaires/${questionnaireId}`, {
    method: 'DELETE',
  })
}
