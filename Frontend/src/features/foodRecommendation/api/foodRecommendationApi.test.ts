import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  recommendFood,
  type FoodRecommendationRequest,
  type FoodRecommendationResponse,
} from './foodRecommendationApi'

const request: FoodRecommendationRequest = {
  petName: '초코',
  species: 'DOG',
  age: 3,
  weight: 5.5,
  healthConcerns: '피부 알레르기 및 가려움',
  currentFoodType: '건식 사료',
  additionalNotes: '닭고기 알레르기가 의심돼요.',
}

describe('recommendFood', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('반려동물 정보를 FastAPI 사료 추천 엔드포인트로 전달한다', async () => {
    const result: FoodRecommendationResponse = {
      petSummary: '초코(강아지, 3세, 체중 5.5kg)',
      recommendedIngredients: [{ name: '오메가-3 지방산', reason: '피부 건강에 도움을 줍니다.' }],
      avoidIngredients: ['닭고기'],
      feedingTips: ['7~10일에 걸쳐 천천히 교체해 주세요.'],
      vetNote: '증상이 지속되면 동물병원 진료를 받아보세요.',
    }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(recommendFood(request)).resolves.toEqual(result)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/ai/recommend-food',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(request),
      }),
    )
  })

  it('FastAPI 입력 검증 오류를 읽을 수 있는 메시지로 전달한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      detail: [{ msg: '나이는 0 이상이어야 합니다.' }],
    }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    })))

    await expect(recommendFood(request)).rejects.toThrow('나이는 0 이상이어야 합니다.')
  })
})
