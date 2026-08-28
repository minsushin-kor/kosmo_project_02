import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWalkAdvice } from '../hooks/useWalkAdvice'
import { WalkAdviceProvider } from './WalkAdviceProvider'

const api = vi.hoisted(() => ({
  getWalkAdvice: vi.fn(),
}))

vi.mock('../../pets/hooks/usePets', () => ({
  usePets: () => ({ selectedPet: { id: 1, name: '초코' } }),
}))
vi.mock('../api/walkAdviceApi', () => api)

function AdviceConsumer({ label }: { label: string }) {
  const { advice } = useWalkAdvice()
  return <span>{label}: {advice?.recommendationScore ?? '-'}</span>
}

describe('WalkAdviceProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getWalkAdvice.mockResolvedValue({
      petId: 1,
      condition: 'GOOD',
      recommendationScore: 88,
      location: '서울특별시 종로구',
      locationSource: 'MEMBER_ADDRESS',
      observedAt: '8월 28일 17:00 기준',
      temperature: 26.5,
      precipitationProbability: 10,
      precipitationAmount: 0,
      windSpeed: 2,
      airQualityLabel: '좋음',
      pm10: 20,
      pm25: 10,
      recommendationReason: '산책하기 무난해요.',
    })
  })

  it('기본 주소 날씨를 한 번 조회해 여러 화면에 공유한다', async () => {
    render(
      <WalkAdviceProvider>
        <AdviceConsumer label="상단" />
        <AdviceConsumer label="다이어리" />
      </WalkAdviceProvider>,
    )

    expect(await screen.findByText('상단: 88')).toBeInTheDocument()
    expect(screen.getByText('다이어리: 88')).toBeInTheDocument()
    expect(api.getWalkAdvice).toHaveBeenCalledTimes(1)
    expect(api.getWalkAdvice).toHaveBeenCalledWith(1, expect.any(AbortSignal))
  })
})
