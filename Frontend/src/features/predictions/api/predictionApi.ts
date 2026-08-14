import { apiRequest } from '../../../lib/api'

export type RiskGrade =
    | 'NORMAL'
    | 'WATCH'
    | 'CAUTION'
    | 'DANGER'

export type PredictionResponse = {
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
    return apiRequest<PredictionResponse>(
        `/api/questionnaires/${questionnaireId}/predictions`,
        {
            method: 'POST',
        },
    )
}

export function getPrediction(
    predictionId: number,
) {
    return apiRequest<PredictionResponse>(
        `/api/predictions/${predictionId}`,
    )
}