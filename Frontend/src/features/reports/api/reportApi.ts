import { apiRequest } from '../../../shared/api/apiClient'

export type WeeklyReport = {
  reportId: number
  petId: number
  startDate: string
  endDate: string
  averageTemperature: number | null
  averageHeartRate: number | null
  warningCount: number
  dangerCount: number
  questionnaireCount: number
  averageRiskProbability: number | null
  oneLineSummary: string | null
  reportContent: string | null
  createdAt: string
}

export function getWeeklyReports(petId: string, signal?: AbortSignal) {
  return apiRequest<WeeklyReport[]>(`/pets/${petId}/reports/weekly`, { signal })
}

export function getWeeklyReport(reportId: string, signal?: AbortSignal) {
  return apiRequest<WeeklyReport>(`/reports/${reportId}`, { signal })
}

export function createWeeklyReport(petId: string) {
  return apiRequest<WeeklyReport>(`/pets/${petId}/reports/weekly`, { method: 'POST' })
}
