import { describe, expect, it } from 'vitest'
import { getPetAge } from './types'

describe('getPetAge', () => {
  const today = new Date(2026, 8, 1, 12)

  it('1살 미만은 완료된 개월 수로 표시한다', () => {
    expect(getPetAge('2026-03-15', today)).toBe('5개월')
    expect(getPetAge('2025-09-02', today)).toBe('11개월')
  })

  it('생후 한 달이 지나지 않은 경우 0개월로 표시한다', () => {
    expect(getPetAge('2026-08-15', today)).toBe('0개월')
  })

  it('1살 이상은 기존처럼 살 단위로 표시한다', () => {
    expect(getPetAge('2025-09-01', today)).toBe('1살')
    expect(getPetAge('2022-01-01', today)).toBe('4살')
  })
})
