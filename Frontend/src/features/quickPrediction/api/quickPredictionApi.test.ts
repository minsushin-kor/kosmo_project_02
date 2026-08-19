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

  it('현재 상태를 FastAPI 예측 엔드포인트로 전달한다', async () => {
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
      'http://localhost:8000/ai/predict-health-risk',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(request),
      }),
    )
  })

  it('FastAPI 입력 검증 오류를 읽을 수 있는 메시지로 전달한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      detail: [{ msg: 'Input should be less than or equal to 45' }],
    }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    })))

    await expect(predictHealthRisk(request))
      .rejects.toThrow('Input should be less than or equal to 45')
  })
})
