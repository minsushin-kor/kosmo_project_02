import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getWalkAdvice } from '../api/walkAdviceApi'
import { WalkAdviceWidget } from './WalkAdviceWidget'

vi.mock('../api/walkAdviceApi', () => ({
  getWalkAdvice: vi.fn(),
}))

const getWalkAdviceMock = vi.mocked(getWalkAdvice)

describe('WalkAdviceWidget', () => {
  beforeEach(() => {
    getWalkAdviceMock.mockClear()
    getWalkAdviceMock.mockResolvedValue({
      petId: 1,
      condition: 'GOOD',
      recommendationScore: 92,
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
      recommendationReason: '기온과 강수, 대기질이 산책하기 무난해요.',
    })
  })

  it('회원 주소 기준 실제 산책 추천도와 날씨를 표시한다', async () => {
    render(<WalkAdviceWidget petId={1} petName="코코" />)

    const weatherLink = await screen.findByRole('link', {
      name: /코코와 산책하기 딱 좋은 날씨예요! 기상청 날씨를 새 탭에서 자세히 보기/,
    })

    expect(weatherLink).toHaveAttribute('href', 'https://www.weather.go.kr/w/index.do')
    expect(weatherLink).toHaveAttribute('target', '_blank')
    expect(screen.getByText('서울특별시 종로구 청운동')).toBeInTheDocument()
    expect(screen.getByText('등록 주소')).toBeInTheDocument()
    expect(screen.getByText('92점')).toBeInTheDocument()
    expect(getWalkAdviceMock).toHaveBeenCalledWith(1, expect.anything(), undefined)
  })

  it('입력한 다른 지역을 조회하고 회원 주소로 돌아간다', async () => {
    render(<WalkAdviceWidget petId={1} petName="코코" />)
    await screen.findByRole('link')

    fireEvent.change(screen.getByLabelText('다른 지역'), {
      target: { value: '부산 해운대구' },
    })
    fireEvent.click(screen.getByRole('button', { name: '확인' }))

    await waitFor(() => {
      expect(getWalkAdviceMock).toHaveBeenLastCalledWith(
        1,
        expect.anything(),
        '부산 해운대구',
      )
    })

    fireEvent.click(await screen.findByRole('button', { name: '내 주소로 돌아가기' }))
    await waitFor(() => {
      expect(getWalkAdviceMock).toHaveBeenLastCalledWith(1, expect.anything(), undefined)
    })
  })
})
