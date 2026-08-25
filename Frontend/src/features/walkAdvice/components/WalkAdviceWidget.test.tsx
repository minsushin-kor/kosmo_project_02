import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getWalkAdvice } from '../api/walkAdviceApi'
import { WalkAdviceWidget } from './WalkAdviceWidget'

vi.mock('../api/walkAdviceApi', () => ({
  getWalkAdvice: vi.fn(),
  getWalkAdviceMockScenario: () => 'SUNNY',
}))

const getWalkAdviceMock = vi.mocked(getWalkAdvice)

describe('WalkAdviceWidget', () => {
  beforeEach(() => {
    getWalkAdviceMock.mockClear()
    getWalkAdviceMock.mockResolvedValue({
      petId: 1,
      condition: 'SUNNY',
      location: '서울특별시 종로구',
      observedAt: '오늘 14:00 기준',
      temperature: 23,
      precipitationProbability: 10,
      airQualityLabel: '좋음',
    })
  })

  it('반려동물 이름과 목업 날씨를 표시하고 카드 전체를 기상청으로 연결한다', async () => {
    render(<WalkAdviceWidget petId={1} petName="코코" />)

    const weatherLink = await screen.findByRole('link', {
      name: /코코와 산책하기 딱 좋은 날씨예요! 기상청 날씨를 새 탭에서 자세히 보기/,
    })

    expect(weatherLink).toHaveAttribute('href', 'https://www.weather.go.kr/w/index.do')
    expect(weatherLink).toHaveAttribute('target', '_blank')
    expect(weatherLink).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByText('서울특별시 종로구')).toBeInTheDocument()
    expect(screen.getByText('미세먼지 좋음')).toBeInTheDocument()
  })

  it('세 가지 목업 날씨 버튼으로 조회 시나리오를 바꾼다', async () => {
    render(<WalkAdviceWidget petId={1} petName="코코" />)

    await screen.findByRole('link')

    const sunnyButton = screen.getByRole('button', { name: '맑은 날' })
    const cloudyButton = screen.getByRole('button', { name: '흐린 날' })

    expect(sunnyButton).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(cloudyButton)
    expect(cloudyButton).toHaveAttribute('aria-pressed', 'true')

    await waitFor(() => {
      expect(getWalkAdviceMock).toHaveBeenLastCalledWith(1, expect.anything(), 'CHANGEABLE')
    })
  })
})
