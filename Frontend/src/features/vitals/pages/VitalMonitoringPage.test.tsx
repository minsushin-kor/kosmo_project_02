import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PetContext, type PetContextValue } from '../../pets/context/PetContext'
import type { Pet } from '../../pets/types'
import type { QuestionnaireResponse } from '../../questionnaire/api/questionnaireApi'
import { VitalMonitoringPage } from './VitalMonitoringPage'

const apiMocks = vi.hoisted(() => ({
  getQuestionnaires: vi.fn(),
  getPredictions: vi.fn(),
}))

vi.mock('../../questionnaire/api/questionnaireApi', () => ({
  getQuestionnaires: apiMocks.getQuestionnaires,
}))

vi.mock('../../predictions/api/predictionApi', () => ({
  getPredictions: apiMocks.getPredictions,
}))

const pet: Pet = {
  id: 1,
  name: '초코',
  species: 'DOG',
  breed: '푸들',
  birthDate: '2022-01-01',
  sex: 'MALE',
  weight: 5,
  neutered: true,
  medicalHistory: '',
  accent: 'sage',
}

function questionnaire(
  questionnaireId: number,
  submittedAt: string,
  temperature: number,
  heartRate: number,
): QuestionnaireResponse {
  return {
    questionnaireId,
    petId: pet.id,
    temperature,
    heartRate,
    respiratoryRate: 24 + questionnaireId,
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
    submittedAt,
  }
}

const petContext: PetContextValue = {
  pets: [pet],
  selectedPet: pet,
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

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/pets/1/vitals']}>
      <PetContext.Provider value={petContext}>
        <Routes>
          <Route path="/pets/:petId/vitals" element={<VitalMonitoringPage />} />
        </Routes>
      </PetContext.Provider>
    </MemoryRouter>,
  )
}

describe('VitalMonitoringPage 문진 기반 건강 수치 변화', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2026-08-26T12:00:00+09:00'))
    apiMocks.getPredictions.mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('문진 입력값을 불러와 일 단위 그래프와 최근 수치에 반영한다', async () => {
    apiMocks.getQuestionnaires.mockResolvedValue([
      questionnaire(2, '2026-08-26T10:00:00+09:00', 38.9, 104),
      questionnaire(1, '2026-08-23T10:00:00+09:00', 38.3, 92),
    ])
    apiMocks.getPredictions.mockResolvedValue([
      {
        predictionId: 7,
        questionnaireId: 2,
        abnormalProbability: 0.2,
        riskGrade: 'WATCH',
        primaryRiskFactor: null,
        riskFactorsJson: null,
        aiSummary: null,
        modelVersion: '1',
        predictedAt: '2026-08-26T10:01:00+09:00',
      },
    ])

    renderPage()

    expect(await screen.findByRole('heading', { name: '건강 수치 변화' })).toBeInTheDocument()
    expect(screen.getByText('38.9')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /일 단위 체온 변화 그래프, 문진 입력 2건/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '자동' })).not.toBeInTheDocument()
    expect(screen.getAllByText('관찰').length).toBeGreaterThan(0)
    expect(screen.getByText('AI 분석을 완료하지 않은 건강 기록이 1건 있어요.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '미분석 기록 확인' })).toHaveAttribute(
      'href',
      '/pets/1/history?tab=history&status=PENDING',
    )
    expect(screen.getAllByRole('link', { name: /건강 기록 자세히 보기/ })).toHaveLength(2)
    expect(apiMocks.getQuestionnaires).toHaveBeenCalledWith(1, expect.any(AbortSignal))

    fireEvent.click(screen.getByRole('button', { name: '심박수' }))
    expect(screen.getByRole('img', { name: /일 단위 심박수 변화 그래프/ })).toBeInTheDocument()
  })

  it('월 버튼을 누르면 오래된 기록을 포함한 월 범위로 변경한다', async () => {
    apiMocks.getQuestionnaires.mockResolvedValue([
      questionnaire(2, '2026-08-26T10:00:00+09:00', 38.9, 104),
      questionnaire(1, '2025-12-12T10:00:00+09:00', 38.3, 92),
    ])

    renderPage()

    await screen.findByRole('heading', { name: '건강 수치 변화' })
    fireEvent.click(screen.getByRole('button', { name: '월' }))
    expect(screen.getByRole('img', { name: /월 단위 체온 변화 그래프, 문진 입력 2건/ })).toBeInTheDocument()
  })

  it('문진 기록이 없으면 입력 화면으로 이동할 수 있는 빈 상태를 보여준다', async () => {
    apiMocks.getQuestionnaires.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('아직 입력한 건강 문진이 없습니다.')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('link', { name: '첫 건강 문진 입력하기' })).toHaveAttribute(
      'href',
      '/pets/1/questionnaire',
    ))
  })
})
