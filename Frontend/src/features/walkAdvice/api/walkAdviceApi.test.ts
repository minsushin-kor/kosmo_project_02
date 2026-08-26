import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from '../../../shared/api/apiClient'
import { getWalkAdvice } from './walkAdviceApi'

vi.mock('../../../shared/api/apiClient', () => ({
  apiRequest: vi.fn(),
}))

const apiRequestMock = vi.mocked(apiRequest)

describe('walkAdviceApi', () => {
  beforeEach(() => {
    apiRequestMock.mockReset()
    apiRequestMock.mockResolvedValue({
      success: true,
      data: { petId: 1, condition: 'GOOD' },
    })
  })

  it('회원 주소 조회에서는 별도 위치를 보내지 않는다', async () => {
    await getWalkAdvice(1)

    expect(apiRequestMock).toHaveBeenCalledWith('/walk-advice?petId=1', {
      signal: undefined,
    })
  })

  it('검색한 지역을 URL에 안전하게 인코딩한다', async () => {
    await getWalkAdvice(1, undefined, '부산 해운대구')

    expect(apiRequestMock).toHaveBeenCalledWith(
      '/walk-advice?petId=1&location=%EB%B6%80%EC%82%B0+%ED%95%B4%EC%9A%B4%EB%8C%80%EA%B5%AC',
      { signal: undefined },
    )
  })
})
