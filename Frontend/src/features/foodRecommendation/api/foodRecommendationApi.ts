import { apiRequest } from '../../../shared/api/apiClient'

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

export async function recommendFood(
  request: FoodRecommendationRequest,
  signal?: AbortSignal,
) {
  return apiRequest<FoodRecommendationResponse>('/ai/food-recommendations', {
    method: 'POST',
    body: JSON.stringify(request),
    signal,
  })
}
