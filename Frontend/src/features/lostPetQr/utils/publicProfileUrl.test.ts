import { describe, expect, it } from 'vitest'
import { buildLostPetProfileUrl } from './publicProfileUrl'

describe('buildLostPetProfileUrl', () => {
  it('기본 주소의 마지막 슬래시를 제거하고 토큰을 인코딩한다', () => {
    expect(buildLostPetProfileUrl('abc/123', 'http://192.0.2.10:5173/'))
      .toBe('http://192.0.2.10:5173/lost-pet/abc%2F123')
  })
})
