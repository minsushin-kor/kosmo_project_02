import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../../auth/context/AuthContext'
import { PetContext, type PetContextValue } from '../../pets/context/PetContext'
import type { Pet } from '../../pets/types'
import { FoodRecommendationPage } from './FoodRecommendationPage'

const pet: Pet = {
  id: 1,
  name: '코코',
  species: 'DOG',
  breed: '푸들',
  birthDate: '2023-08-01',
  sex: 'FEMALE',
  weight: 5.5,
  neutered: true,
  medicalHistory: '',
  accent: 'sage',
}

const petContext: PetContextValue = {
  pets: [pet],
  selectedPet: pet,
  isLoading: false,
  isDemoMode: false,
  error: '',
  selectPet: vi.fn(),
  addPet: vi.fn(),
  updatePet: vi.fn(),
  removePet: vi.fn(),
  reloadPets: vi.fn(),
}

function renderPage(currentUser: AuthContextValue['currentUser']) {
  const authContext: AuthContextValue = {
    currentUser,
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  }

  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authContext}>
        <PetContext.Provider value={petContext}>
          <FoodRecommendationPage />
        </PetContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('FoodRecommendationPage 로그인별 초기값', () => {
  it('비로그인 상태에서는 모든 입력값을 비우고 로그인 안내를 표시한다', () => {
    renderPage(null)

    expect(screen.getByLabelText('이름')).toHaveValue('')
    expect(screen.getByRole('radio', { name: /강아지/ })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: /고양이/ })).not.toBeChecked()
    expect(screen.getByRole('spinbutton', { name: /나이/ })).toHaveValue(null)
    expect(screen.getByRole('spinbutton', { name: /체중/ })).toHaveValue(null)
    expect(screen.getByText('로그인하면 등록된 아이 정보를 불러올 수 있어요.')).toBeInTheDocument()
  })

  it('로그인 상태에서는 선택된 반려동물의 기본 정보를 채운다', () => {
    renderPage({
      name: '홍길동',
      username: 'tester',
      email: 'tester@example.com',
      phone: '010-0000-0000',
      postalCode: '00000',
      address: '서울시',
      detailAddress: '1층',
    })

    expect(screen.getByLabelText('이름')).toHaveValue('코코')
    expect(screen.getByRole('radio', { name: /강아지/ })).toBeChecked()
    expect(screen.getByRole('spinbutton', { name: /체중/ })).toHaveValue(5.5)
    expect(screen.getByPlaceholderText('예시: 피부 알레르기 및 가려움')).toHaveValue('')
  })

  it('건강 고민 항목을 여러 개 동시에 선택할 수 있다', () => {
    renderPage(null)

    const allergyButton = screen.getByRole('button', { name: '피부·알레르기' })
    const jointButton = screen.getByRole('button', { name: '관절 건강' })

    fireEvent.click(allergyButton)
    fireEvent.click(jointButton)

    expect(allergyButton).toHaveAttribute('aria-pressed', 'true')
    expect(jointButton).toHaveAttribute('aria-pressed', 'true')
  })
})
