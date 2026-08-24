import type { HealthPrediction } from '../../predictions/api/predictionApi'

export function getLatestPredictionsByDate(
  predictions: HealthPrediction[],
) {
  return predictions.reduce<Record<string, HealthPrediction>>(
    (latestByDate, prediction) => {
      const date = prediction.predictedAt.slice(0, 10)
      const current = latestByDate[date]

      if (
        !current ||
        Date.parse(prediction.predictedAt) > Date.parse(current.predictedAt)
      ) {
        latestByDate[date] = prediction
      }

      return latestByDate
    },
    {},
  )
}
