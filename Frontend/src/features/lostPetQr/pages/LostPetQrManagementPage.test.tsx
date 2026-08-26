import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../../auth/hooks/useAuth'
import { usePets } from '../../pets/hooks/usePets'
import {
  deleteLostPetQrProfile,
  getLostPetQrProfile,
  updateLostPetQrVisibility,
} from '../api/lostPetQrApi'
import type { LostPetQrProfile } from '../types'
import { LostPetQrManagementPage } from './LostPetQrManagementPage'

vi.mock('../../auth/hooks/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('../../pets/hooks/usePets', () => ({ usePets: vi.fn() }))
vi.mock('../api/lostPetQrApi', () => ({
  createLostPetQrProfile: vi.fn(),
  deleteLostPetQrProfile: vi.fn(),
  getLostPetQrProfile: vi.fn(),
  updateLostPetQrActive: vi.fn(),
  updateLostPetQrVisibility: vi.fn(),
}))

const useAuthMock = vi.mocked(useAuth)
const usePetsMock = vi.mocked(usePets)
const getProfileMock = vi.mocked(getLostPetQrProfile)
const deleteProfileMock = vi.mocked(deleteLostPetQrProfile)
const updateVisibilityMock = vi.mocked(updateLostPetQrVisibility)

const profile: LostPetQrProfile = {
  publicToken: 'public-token',
  active: true,
  guardianName: '김보호',
  guardianPhone: '010-1234-5678',
  petName: '초코',
  species: 'DOG',
  breed: '푸들',
  medicalHistory: '심장약 복용 중',
  showGuardianName: true,
  showPetDetails: true,
  showMedicalHistory: true,
}

describe('LostPetQrManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthMock.mockReturnValue({
      currentUser: {
        userId: 1,
        name: '김보호',
        username: 'guardian',
        email: 'guardian@example.com',
        phone: '010-1234-5678',
        role: 'USER',
      },
      isAuthLoading: false,
      register: vi.fn(),
      login: vi.fn(),
      updateProfile: vi.fn(),
      logout: vi.fn(),
    })
    usePetsMock.mockReturnValue({
      pets: [{
        id: 1,
        name: '초코',
        species: 'DOG',
        breed: '푸들',
        birthDate: '2022-01-01',
        sex: 'MALE',
        weight: 5,
        neutered: true,
        medicalHistory: '심장약 복용 중',
        accent: 'sage',
      }],
      selectedPet: null,
      isLoading: false,
      error: '',
      selectPet: vi.fn(),
      addPet: vi.fn(),
      updatePet: vi.fn(),
      uploadPetProfileImage: vi.fn(),
      deletePetProfileImage: vi.fn(),
      removePet: vi.fn(),
      reloadPets: vi.fn().mockResolvedValue(undefined),
    })
    getProfileMock.mockResolvedValue(profile)
    deleteProfileMock.mockResolvedValue(undefined)
    updateVisibilityMock.mockResolvedValue({
      ...profile,
      showGuardianName: false,
    })
  })

  it('DB 정보는 읽기 전용으로 두고 기존 QR의 공개 범위만 저장한다', async () => {
    render(<MemoryRouter><LostPetQrManagementPage /></MemoryRouter>)

    expect(await screen.findByText(/초코를 잃어버렸을 때 발견한 분께 연락받을 수 있는 QR 코드 생성을 도와드릴게요/)).toBeInTheDocument()
    expect(screen.queryByText(/목걸이에 담는/)).not.toBeInTheDocument()
    expect((await screen.findAllByText('강아지 · 푸들')).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: '회원정보 수정' })).toHaveAttribute('href', '/mypage/profile')
    expect(screen.getByRole('link', { name: '반려동물 정보 수정' })).toHaveAttribute('href', '/pets/1/edit')
    expect(screen.queryByLabelText('품종')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '공개 범위 수정' }))
    fireEvent.click(screen.getByRole('checkbox', { name: '보호자 이름' }))
    fireEvent.click(screen.getByRole('button', { name: '공개 범위 저장' }))

    await waitFor(() => expect(updateVisibilityMock).toHaveBeenCalledWith(1, {
      showGuardianName: false,
      showPetDetails: true,
      showMedicalHistory: true,
    }))
    expect(await screen.findByText('기존 QR의 공개 범위를 저장했습니다.')).toBeInTheDocument()
  })

  it('재발급 대신 기존 QR을 삭제한다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<MemoryRouter><LostPetQrManagementPage /></MemoryRouter>)

    fireEvent.click(await screen.findByRole('button', { name: 'QR 삭제' }))

    await waitFor(() => expect(deleteProfileMock).toHaveBeenCalledWith(1))
    expect(await screen.findByText(/이전 QR 주소는 더 이상 사용할 수 없습니다/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'QR 주소 재발급' })).not.toBeInTheDocument()
  })
})
