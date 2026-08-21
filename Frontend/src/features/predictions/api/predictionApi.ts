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

/**
 * 기존 우리 코드에서 사용하던 타입명 호환용
 */
export type PredictionResponse = HealthPrediction

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

export function getPrediction(
    predictionId: number,
    signal?: AbortSignal,
) {
    return apiRequest<HealthPrediction>(
        `/predictions/${predictionId}`,
        {
            signal,
        },
    )
}

export function getPredictionByQuestionnaire(
    questionnaireId: number,
    signal?: AbortSignal,
) {
    return apiRequest<HealthPrediction>(
        `/questionnaires/${questionnaireId}/prediction`,
        {
            signal,
        },
    )
}