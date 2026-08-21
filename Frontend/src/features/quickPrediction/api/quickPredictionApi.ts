export type Species = 'DOG' | 'CAT'
export type Level = 'DECREASED' | 'NORMAL' | 'INCREASED'
export type ActivityLevel = 'LOW' | 'NORMAL' | 'HIGH'
export type RiskGrade = 'NORMAL' | 'WATCH' | 'CAUTION' | 'DANGER'

export type QuickPredictionRequest = {
  species: Species
  age: number
  weight: number
  temperature: number
  heartRate: number
  respiratoryRate: number
  skinRedness: boolean
  itching: boolean
  hairLoss: boolean
  vomiting: boolean
  diarrhea: boolean
  appetiteLevel: Level
  waterIntakeLevel: Level
  activityLevel: ActivityLevel
  symptomDurationDays: number
}

export type QuickPredictionResponse = {
  abnormalProbability: number
  riskGrade: RiskGrade
  primaryRiskFactor: string
}

const DEFAULT_PREDICTION_API_URL = 'http://localhost:8000/ai/predict-health-risk'

type PredictionErrorPayload = {
  detail?: string | Array<{ msg?: string }>
  message?: string
}

function getPredictionApiUrl() {
  return import.meta.env.VITE_PREDICTION_API_URL?.trim() || DEFAULT_PREDICTION_API_URL
}

export async function predictHealthRisk(
  request: QuickPredictionRequest,
  signal?: AbortSignal,
) {
  const response = await fetch(getPredictionApiUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
    signal,
  })

  if (!response.ok) {
    let message = `예측 요청을 처리하지 못했습니다. (${response.status})`

    try {
      const payload = await response.json() as PredictionErrorPayload

      if (typeof payload.detail === 'string') {
        message = payload.detail
      } else if (Array.isArray(payload.detail)) {
        const validationMessage = payload.detail
          .map((item) => item.msg)
          .filter(Boolean)
          .join(', ')
        message = validationMessage || message
      } else if (payload.message) {
        message = payload.message
      }
    } catch {
      // JSON 오류 응답이 아니면 상태 코드 기반 문구를 사용합니다.
    }

    throw new Error(message)
  }

  return response.json() as Promise<QuickPredictionResponse>
}
