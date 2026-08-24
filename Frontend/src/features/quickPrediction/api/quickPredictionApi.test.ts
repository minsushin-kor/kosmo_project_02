import { afterEach, describe, expect, it, vi } from 'vitest'
import { predictHealthRisk, type QuickPredictionRequest } from './quickPredictionApi'

const request: QuickPredictionRequest = {
  species: 'DOG',
  age: 5,
  weight: 7,
  temperature: 38.5,
  heartRate: 100,
  respiratoryRate: 24,
  skinRedness: false,
  itching: false,
  hairLoss: false,
  vomiting: false,
  diarrhea: false,
  appetiteLevel: 'NORMAL',
  waterIntakeLevel: 'NORMAL',
  activityLevel: 'NORMAL',
  symptomDurationDays: 0,
}

describe('predictHealthRisk', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('현재 상태를 Spring Quick Prediction 엔드포인트로 전달한다', async () => {
    const result = {
      abnormalProbability: 0.18,
      riskGrade: 'NORMAL',
      primaryRiskFactor: '뚜렷한 위험 요인 없음',
    }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(predictHealthRisk(request)).resolves.toEqual(result)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ai/quick-predictions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(request),
      }),
    )
  })

  it('Spring Gateway 오류 메시지를 전달한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: false,
      message: 'AI 건강 예측 서비스를 일시적으로 사용할 수 없습니다.',
      error: 'EXTERNAL_SERVICE_ERROR',
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })))

    await expect(predictHealthRisk(request))
      .rejects.toThrow('AI 건강 예측 서비스를 일시적으로 사용할 수 없습니다.')
  })
})
