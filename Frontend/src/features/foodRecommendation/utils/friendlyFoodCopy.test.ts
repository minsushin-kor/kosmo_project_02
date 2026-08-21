import { describe, expect, it } from 'vitest'
import { makeFoodCopyFriendly } from './friendlyFoodCopy'

describe('makeFoodCopyFriendly', () => {
  it('급여 안내를 일상적인 식사 표현으로 바꾼다', () => {
    expect(makeFoodCopyFriendly('일일 권장 급여량을 하루 2회 규칙적으로 급여하세요.'))
      .toBe('일일 권장 식사량을 하루 2회 규칙적으로 식사를 챙겨주세요.')
  })

  it('간식 관련 안내를 자연스럽게 바꾼다', () => {
    expect(makeFoodCopyFriendly('사료 교체 기간에는 간식 급여를 최소화하세요.'))
      .toBe('사료 교체 기간에는 간식을 주는 것을 최소화하세요.')
  })

  it('변환한 결과에 급여라는 표현을 남기지 않는다', () => {
    expect(makeFoodCopyFriendly('급여 전과 급여 후 상태를 살피고 급여 횟수를 조절하세요.'))
      .not.toContain('급여')
  })
})
