export type FoodRecommendationSpecies = 'DOG' | 'CAT'

export type FoodRecommendationRequest = {
  petName?: string
  species: FoodRecommendationSpecies
  age: number
  weight?: number
  healthConcerns?: string
  currentFoodType?: string
  additionalNotes?: string
}

export type RecommendedIngredient = {
  name: string
  reason: string
}

export type FoodRecommendationResponse = {
  petSummary: string
  recommendedIngredients: RecommendedIngredient[]
  avoidIngredients: string[]
  feedingTips: string[]
  vetNote: string
}

const DEFAULT_FOOD_RECOMMEND_API_URL = 'http://localhost:8000/ai/recommend-food'

type FoodRecommendationErrorPayload = {
  detail?: string | Array<{ msg?: string }>
  message?: string
}

function getFoodRecommendApiUrl() {
  return import.meta.env.VITE_FOOD_RECOMMEND_API_URL?.trim() || DEFAULT_FOOD_RECOMMEND_API_URL
}

export async function recommendFood(
  request: FoodRecommendationRequest,
  signal?: AbortSignal,
) {
  const response = await fetch(getFoodRecommendApiUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
    signal,
  })

  if (!response.ok) {
    let message = `사료 추천 요청을 처리하지 못했습니다. (${response.status})`

    try {
      const payload = await response.json() as FoodRecommendationErrorPayload

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
      // JSON 형식이 아닌 오류 응답은 상태 코드 기반 문구로 안내합니다.
    }

    throw new Error(message)
  }

  return response.json() as Promise<FoodRecommendationResponse>
}
