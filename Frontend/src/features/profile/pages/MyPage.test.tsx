import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../../auth/context/AuthContext'
import { PetContext, type PetContextValue } from '../../pets/context/PetContext'
import { MyPage } from './MyPage'

const auth: AuthContextValue = {
  currentUser: { userId: 1, name: '보호자', username: 'guardian', email: 'user@example.com', phone: '', role: 'USER' },
  isAuthLoading: false,
  register: vi.fn(),
  login: vi.fn(),
  updateProfile: vi.fn(),
  logout: vi.fn(),
}

const pets: PetContextValue = {
  pets: [{ id: 1, name: '초코', species: 'DOG', breed: '푸들', birthDate: '2022-01-01', sex: 'MALE', weight: 5, neutered: true, medicalHistory: '', accent: 'sage' }],
  selectedPet: null,
  isLoading: false,
  error: '',
  selectPet: vi.fn(),
  addPet: vi.fn(),
  updatePet: vi.fn(),
  uploadPetProfileImage: vi.fn(),
  deletePetProfileImage: vi.fn(),
  removePet: vi.fn(),
  reloadPets: vi.fn(),
}

describe('MyPage 관리 목록', () => {
  it('회원정보와 반려동물 수정 화면을 구분해 연결한다', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={auth}>
          <PetContext.Provider value={pets}>
            <MyPage />
          </PetContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /회원정보 수정/ })).toHaveAttribute('href', '/mypage/profile')
    expect(screen.getByRole('link', { name: /반려동물 정보 수정/ })).toHaveAttribute('href', '/mypage/pets')
    expect(screen.getByText(/총 1마리 · 초코/)).toBeInTheDocument()
  })
})
