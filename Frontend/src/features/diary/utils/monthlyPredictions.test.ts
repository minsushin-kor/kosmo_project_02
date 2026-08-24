import { describe, expect, it } from 'vitest'
import type { HealthPrediction } from '../../predictions/api/predictionApi'
import { getLatestPredictionsByDate } from './monthlyPredictions'

function prediction(
  predictionId: number,
  riskGrade: HealthPrediction['riskGrade'],
  predictedAt: string,
): HealthPrediction {
  return {
    predictionId,
    questionnaireId: predictionId,
    abnormalProbability: 0.5,
    riskGrade,
    primaryRiskFactor: null,
    riskFactorsJson: null,
    aiSummary: null,
    modelVersion: '1.0.0',
    predictedAt,
  }
}

describe('getLatestPredictionsByDate', () => {
  it('keeps only the latest predictedAt for each date', () => {
    const result = getLatestPredictionsByDate([
      prediction(1, 'WATCH', '2026-08-18T09:00:00'),
      prediction(2, 'CAUTION', '2026-08-18T14:20:00'),
      prediction(3, 'NORMAL', '2026-08-19T08:00:00'),
    ])

    expect(result['2026-08-18']).toMatchObject({ predictionId: 2, riskGrade: 'CAUTION' })
    expect(result['2026-08-19']).toMatchObject({ predictionId: 3, riskGrade: 'NORMAL' })
  })
})
