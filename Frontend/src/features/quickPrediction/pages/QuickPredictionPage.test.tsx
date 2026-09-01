import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pet } from '../../pets/types'
import { QuickPredictionPage } from './QuickPredictionPage'

const testState = vi.hoisted(() => ({
  currentUser: null as { name: string } | null,
  pets: [] as Pet[],
  selectedPet: null as Pet | null,
  selectPet: vi.fn(),
  getQuestionnaires: vi.fn(),
  predictHealthRisk: vi.fn(),
}))

vi.mock('../../auth/hooks/useAuth', () => ({
  useAuth: () => ({ currentUser: testState.currentUser }),
}))

vi.mock('../../pets/hooks/usePets', () => ({
  usePets: () => ({
    pets: testState.pets,
    selectedPet: testState.selectedPet,
    selectPet: testState.selectPet,
  }),
}))

vi.mock('../../questionnaire/api/questionnaireApi', () => ({
  getQuestionnaires: testState.getQuestionnaires,
}))

vi.mock('../api/quickPredictionApi', () => ({
  predictHealthRisk: testState.predictHealthRisk,
}))

const pet: Pet = {
  id: 1,
  name: '초코',
  species: 'DOG',
  breed: '푸들',
  birthDate: '2022-01-01',
  sex: 'MALE',
  weight: 5.4,
  neutered: true,
  medicalHistory: '',
  accent: 'sage',
}

beforeEach(() => {
  testState.currentUser = null
  testState.pets = []
  testState.selectedPet = null
  testState.selectPet.mockReset()
  testState.getQuestionnaires.mockReset().mockResolvedValue([])
  testState.predictHealthRisk.mockReset()
})

describe('QuickPredictionPage 수치 입력', () => {
  it('슬라이더를 변경하면 숫자 입력창 값도 변경한다', () => {
    render(<QuickPredictionPage />)

    fireEvent.change(screen.getByRole('slider', { name: '나이 슬라이더' }), {
      target: { value: '12' },
    })

    expect(screen.getByRole('spinbutton', { name: '나이 직접 입력' })).toHaveValue(12)
  })

  it('숫자 입력창을 변경하면 슬라이더 값도 변경한다', () => {
    render(<QuickPredictionPage />)

    fireEvent.change(screen.getByRole('spinbutton', { name: '체온 직접 입력' }), {
      target: { value: '39.4' },
    })

    expect(screen.getByRole('slider', { name: '체온 슬라이더' })).toHaveValue('39.4')
  })

  it('입력 범위를 벗어난 숫자는 최대값으로 보정한다', () => {
    render(<QuickPredictionPage />)

    fireEvent.change(screen.getByRole('spinbutton', { name: '심박수 직접 입력' }), {
      target: { value: '350' },
    })

    expect(screen.getByRole('spinbutton', { name: '심박수 직접 입력' })).toHaveValue(300)
    expect(screen.getByRole('slider', { name: '심박수 슬라이더' })).toHaveValue('300')
  })

  it('예측 요청 중에는 오른쪽 결과 영역에 분석 로딩 화면을 표시한다', async () => {
    testState.predictHealthRisk.mockImplementation(() => new Promise(() => {}))

    render(<QuickPredictionPage />)

    fireEvent.click(screen.getByRole('button', { name: /예측 시작/ }))

    expect(await screen.findByText('입력한 건강 신호를 분석하고 있어요.')).toBeInTheDocument()
    expect(screen.getByText('예측 결과').closest('aside')).toHaveAttribute('aria-busy', 'true')
  })

  it('로그인한 회원은 선택한 반려동물의 최근 문진을 입력값에 반영한다', async () => {
    testState.currentUser = { name: '김보호' }
    testState.pets = [pet]
    testState.selectedPet = pet
    testState.getQuestionnaires.mockResolvedValue([
      {
        questionnaireId: 10,
        petId: pet.id,
        submittedAt: '2026-08-20T10:00:00',
        temperature: 38.2,
        heartRate: 92,
        respiratoryRate: 20,
        skinCondition: 'NORMAL',
        itching: false,
        hairLoss: false,
        vomiting: false,
        diarrhea: false,
        appetiteLevel: 'NORMAL',
        waterIntakeLevel: 'NORMAL',
        activityLevel: 'NORMAL',
        symptomDurationDays: 0,
        additionalSymptoms: null,
      },
      {
        questionnaireId: 11,
        petId: pet.id,
        submittedAt: '2026-08-27T10:00:00',
        temperature: 39.3,
        heartRate: 118,
        respiratoryRate: 31,
        skinCondition: 'REDNESS',
        itching: true,
        hairLoss: false,
        vomiting: false,
        diarrhea: true,
        appetiteLevel: 'DECREASED',
        waterIntakeLevel: 'INCREASED',
        activityLevel: 'LOW',
        symptomDurationDays: 2,
        additionalSymptoms: null,
      },
    ])

    render(<QuickPredictionPage />)

    await waitFor(() => {
      expect(screen.getByRole('spinbutton', { name: '체온 직접 입력' })).toHaveValue(39.3)
    })
    expect(screen.getByRole('spinbutton', { name: '심박수 직접 입력' })).toHaveValue(118)
    expect(screen.getByRole('spinbutton', { name: '호흡수 직접 입력' })).toHaveValue(31)
    expect(screen.getByText('초코의 최근 건강 기록을 불러왔어요.')).toBeInTheDocument()
  })

  it('반려동물이 5마리를 넘으면 좌우 이동 버튼을 표시한다', () => {
    testState.currentUser = { name: '김보호' }
    testState.pets = Array.from({ length: 6 }, (_, index) => ({
      ...pet,
      id: index + 1,
      name: `아이${index + 1}`,
    }))
    testState.selectedPet = testState.pets[0]

    render(<QuickPredictionPage />)

    expect(screen.getByRole('button', { name: '이전 반려동물 보기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다음 반려동물 보기' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '아이6 선택' }))
    expect(testState.selectPet).toHaveBeenCalledWith(6)
  })
})
