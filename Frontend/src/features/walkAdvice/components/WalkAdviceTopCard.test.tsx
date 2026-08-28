import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WalkAdvice } from '../types'
import { WalkAdviceTopCard } from './WalkAdviceTopCard'

const walkAdviceState = vi.hoisted(() => ({
  petId: 1,
  advice: null as WalkAdvice | null,
  isLoading: false,
  error: '',
}))

vi.mock('../hooks/useWalkAdvice', () => ({
  useWalkAdvice: () => walkAdviceState,
}))

describe('WalkAdviceTopCard', () => {
  beforeEach(() => {
    walkAdviceState.advice = {
      petId: 1,
      condition: 'GOOD',
      recommendationScore: 82,
      location: '서울특별시 종로구 청운동',
      locationSource: 'MEMBER_ADDRESS',
      observedAt: '8월 26일 14:00 기준',
      temperature: 23,
      precipitationProbability: 10,
      precipitationAmount: 0,
      windSpeed: 2,
      airQualityLabel: '좋음',
      pm10: 20,
      pm25: 10,
      recommendationReason: '산책하기 무난해요.',
    }
  })

  it('회원 주소의 산책 점수를 표시하고 건강 다이어리 상세 카드로 이동한다', async () => {
    render(
      <MemoryRouter>
        <WalkAdviceTopCard petId={1} petName="초코" />
      </MemoryRouter>,
    )

    const link = await screen.findByRole('link', {
      name: '초코의 오늘 산책 점수 82점, 산책하기 좋아요. 건강 다이어리에서 자세히 보기',
    })

    expect(link).toHaveAttribute('href', '/pets/1/diary#walk-advice')
    expect(screen.getByText('산책')).toBeInTheDocument()
    expect(screen.getByText('82')).toBeInTheDocument()
  })
})
