import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from '../../../shared/api/apiClient'
import {
  createLostPetQrProfile,
  deleteLostPetQrProfile,
  getPublicLostPetProfile,
  updateLostPetQrActive,
  updateLostPetQrVisibility,
} from './lostPetQrApi'

vi.mock('../../../shared/api/apiClient', () => ({
  apiRequest: vi.fn(),
}))

const apiRequestMock = vi.mocked(apiRequest)

describe('lostPetQrApi', () => {
  beforeEach(() => {
    apiRequestMock.mockReset()
    apiRequestMock.mockResolvedValue({})
  })

  it('공개 프로필은 인증 없이 안전하게 인코딩한 토큰으로 조회한다', async () => {
    const controller = new AbortController()

    await getPublicLostPetProfile('token/value', controller.signal)

    expect(apiRequestMock).toHaveBeenCalledWith(
      '/public/lost-pets/token%2Fvalue',
      { skipAuth: true, signal: controller.signal },
    )
  })

  it('QR 공개 상태를 PATCH 요청으로 변경한다', async () => {
    await updateLostPetQrActive(3, false)

    expect(apiRequestMock).toHaveBeenCalledWith('/pets/3/lost-qr-profile/active', {
      method: 'PATCH',
      body: JSON.stringify({ active: false }),
    })
  })

  it('QR 생성 시 선택한 공개 범위를 함께 저장한다', async () => {
    const visibility = {
      showGuardianName: false,
      showPetDetails: true,
      showMedicalHistory: false,
    }

    await createLostPetQrProfile(3, visibility)

    expect(apiRequestMock).toHaveBeenCalledWith('/pets/3/lost-qr-profile', {
      method: 'POST',
      body: JSON.stringify(visibility),
    })
  })

  it('기존 QR의 공개 범위만 수정한다', async () => {
    const visibility = {
      showGuardianName: false,
      showPetDetails: true,
      showMedicalHistory: false,
    }

    await updateLostPetQrVisibility(3, visibility)

    expect(apiRequestMock).toHaveBeenCalledWith('/pets/3/lost-qr-profile/visibility', {
      method: 'PATCH',
      body: JSON.stringify(visibility),
    })
  })

  it('기존 QR 프로필을 DELETE 요청으로 삭제한다', async () => {
    await deleteLostPetQrProfile(3)

    expect(apiRequestMock).toHaveBeenCalledWith('/pets/3/lost-qr-profile', {
      method: 'DELETE',
    })
  })
})
