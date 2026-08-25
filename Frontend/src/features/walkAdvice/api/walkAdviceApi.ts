import type { WalkAdvice, WalkWeatherCondition } from '../types'

type MockWalkAdvice = Omit<WalkAdvice, 'petId'>

const MOCK_DELAY_MS = 350
const DEFAULT_MOCK_SCENARIO: WalkWeatherCondition = 'SUNNY'

const mockAdviceByCondition: Record<WalkWeatherCondition, MockWalkAdvice> = {
  SUNNY: {
    condition: 'SUNNY',
    location: '서울특별시 종로구',
    observedAt: '오늘 14:00 기준',
    temperature: 23,
    precipitationProbability: 10,
    airQualityLabel: '좋음',
  },
  CHANGEABLE: {
    condition: 'CHANGEABLE',
    location: '서울특별시 종로구',
    observedAt: '오늘 14:00 기준',
    temperature: 20,
    precipitationProbability: 40,
    airQualityLabel: '보통',
  },
  RAINY: {
    condition: 'RAINY',
    location: '서울특별시 종로구',
    observedAt: '오늘 14:00 기준',
    temperature: 18,
    precipitationProbability: 80,
    airQualityLabel: '좋음',
  },
}

export function getWalkAdviceMockScenario(): WalkWeatherCondition {
  const configured = import.meta.env.VITE_WALK_ADVICE_MOCK_SCENARIO?.trim().toUpperCase()

  if (configured === 'SUNNY' || configured === 'CHANGEABLE' || configured === 'RAINY') {
    return configured
  }

  return DEFAULT_MOCK_SCENARIO
}

/**
 * 기상·주소 API가 준비되기 전 사용하는 목업 요청입니다.
 * 추후 동일한 반환 타입을 유지한 채 Spring Boot API 호출로 교체합니다.
 */
export function getWalkAdvice(
  petId: number,
  signal?: AbortSignal,
  mockScenario = getWalkAdviceMockScenario(),
): Promise<WalkAdvice> {
  return new Promise((resolve, reject) => {
    const abortRequest = () => {
      window.clearTimeout(timeoutId)
      reject(new DOMException('산책 날씨 요청이 취소되었습니다.', 'AbortError'))
    }

    const timeoutId = window.setTimeout(() => {
      signal?.removeEventListener('abort', abortRequest)
      resolve({ petId, ...mockAdviceByCondition[mockScenario] })
    }, MOCK_DELAY_MS)

    if (signal?.aborted) {
      abortRequest()
      return
    }

    signal?.addEventListener('abort', abortRequest, { once: true })
  })
}
