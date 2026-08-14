import { apiRequest } from '../../../lib/api'

export type WeeklyReportResponse = {
    reportId: number
    petId: number
    startDate: string
    endDate: string
    averageTemperature: number
    averageHeartRate: number
    warningCount: number
    dangerCount: number
    questionnaireCount: number
    averageRiskProbability: number
    oneLineSummary: string
    reportContent: string
    createdAt: string
}
export function getWeeklyReports(petId: number) {
    return apiRequest<WeeklyReportResponse[]>(
        `/api/pets/${petId}/reports/weekly`,
    )
}

export function getWeeklyReport(reportId: number) {
    return apiRequest<WeeklyReportResponse>(
        `/api/reports/${reportId}`,
    )
}

export function createWeeklyReport(petId: number) {
    return apiRequest<WeeklyReportResponse>(
        `/api/pets/${petId}/reports/weekly`,
        {
            method: 'POST',
        },
    )
}