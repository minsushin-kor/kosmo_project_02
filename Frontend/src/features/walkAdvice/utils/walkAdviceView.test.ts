import { describe, expect, it } from 'vitest'
import { getWalkAdviceCopy } from './walkAdviceView'

describe('getWalkAdviceCopy', () => {
  it('화창한 날에는 반려동물 이름이 포함된 산책 추천 문구를 만든다', () => {
    expect(getWalkAdviceCopy('SUNNY', '코코').headline)
      .toBe('코코와 산책하기 딱 좋은 날씨예요!')
  })

  it('비 오는 날에는 실내 휴식 문구를 만든다', () => {
    expect(getWalkAdviceCopy('RAINY', '코코').headline)
      .toBe('오늘은 코코와 집에서 포근하게 쉬어가요.')
  })

  it('애매한 날에는 짧고 조심스러운 산책 문구를 만든다', () => {
    expect(getWalkAdviceCopy('CHANGEABLE', '코코').headline)
      .toBe('하늘을 살피며 코코와 가볍게 다녀와요.')
  })
})
