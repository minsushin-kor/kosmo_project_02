import { apiRequest } from '../../../shared/api/apiClient'

export type RiskGrade =
    | 'NORMAL'
    | 'WATCH'
    | 'CAUTION'
    | 'DANGER'

export type HealthPrediction = {
    predictionId: number
    questionnaireId: number
    abnormalProbability: number
    riskGrade: RiskGrade
    primaryRiskFactor: string | null
    riskFactorsJson: string | null
    aiSummary: string | null
    modelVersion: string
    predictedAt: string
}

export function createPrediction(
    questionnaireId: number,
) {
    return apiRequest<HealthPrediction>(
        `/questionnaires/${questionnaireId}/predictions`,
        {
            method: 'POST',
        },
    )
}

export function getMonthlyPredictions(
    petId: number,
    year: number,
    month: number,
    signal?: AbortSignal,
) {
    return apiRequest<HealthPrediction[]>(
        `/pets/${petId}/predictions?year=${year}&month=${month}`,
        { signal },
    )
}

export function getPredictions(
    petId: number,
    signal?: AbortSignal,
) {
    return apiRequest<HealthPrediction[]>(
        `/pets/${petId}/predictions`,
        { signal },
    )
}
