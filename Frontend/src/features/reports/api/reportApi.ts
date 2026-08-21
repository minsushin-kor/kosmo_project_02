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

/**
 * 기존 우리 코드에서 사용하던 타입명 호환용
 */
export type WeeklyReportResponse = WeeklyReport

export function getWeeklyReports(
    petId: number,
    signal?: AbortSignal,
) {
    return apiRequest<WeeklyReport[]>(
        `/pets/${petId}/reports/weekly`,
        {
            signal,
        },
    )
}

export function getWeeklyReport(
    reportId: number,
    signal?: AbortSignal,
) {
    return apiRequest<WeeklyReport>(
        `/reports/${reportId}`,
        {
            signal,
        },
    )
}

export function createWeeklyReport(
    petId: number,
) {
    return apiRequest<WeeklyReport>(
        `/pets/${petId}/reports/weekly`,
        {
            method: 'POST',
        },
    )
}