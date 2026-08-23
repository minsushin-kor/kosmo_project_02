import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PetContext, type PetContextValue } from '../../pets/context/PetContext'
import type { Pet } from '../../pets/types'
import type { DiaryEntry } from '../types'
import { HealthDiaryPage } from './HealthDiaryPage'

const apiMocks = vi.hoisted(() => ({
  getDiaryEntries: vi.fn(),
  upsertDiaryEntry: vi.fn(),
  deleteDiaryEntry: vi.fn(),
  getMonthlyPredictions: vi.fn(),
  getVitalRecords: vi.fn(),
  getQuestionnaires: vi.fn(),
  getHealthAlerts: vi.fn(),
  getWeeklyReports: vi.fn(),
}))

vi.mock('../api/healthDiaryApi', () => ({
  getDiaryEntries: apiMocks.getDiaryEntries,
  upsertDiaryEntry: apiMocks.upsertDiaryEntry,
  deleteDiaryEntry: apiMocks.deleteDiaryEntry,
}))

vi.mock('../../predictions/api/predictionApi', () => ({
  getMonthlyPredictions: apiMocks.getMonthlyPredictions,
}))

vi.mock('../../vitals/api/vitalApi', () => ({ getVitalRecords: apiMocks.getVitalRecords }))
vi.mock('../../questionnaire/api/questionnaireApi', () => ({ getQuestionnaires: apiMocks.getQuestionnaires }))
vi.mock('../../history/api/healthHistoryApi', () => ({ getHealthAlerts: apiMocks.getHealthAlerts }))
vi.mock('../../reports/api/reportApi', () => ({ getWeeklyReports: apiMocks.getWeeklyReports }))

const pets: Pet[] = [
  { id: 1, name: '초코', species: 'DOG', breed: '푸들', birthDate: '2022-01-01', sex: 'MALE', weight: 5, neutered: true, medicalHistory: '', accent: 'sage' },
  { id: 2, name: '보리', species: 'CAT', breed: '코숏', birthDate: '2023-01-01', sex: 'FEMALE', weight: 4, neutered: true, medicalHistory: '', accent: 'sand' },
]

function diaryEntry(status: DiaryEntry['status'] = 'GOOD'): DiaryEntry {
  return {
    diaryEntryId: 12,
    petId: 1,
    date: '2026-08-18',
    status,
    note: '보호자 관찰 기록',
    createdAt: '2026-08-18T09:00:00',
    updatedAt: '2026-08-18T14:20:00',
  }
}

function petContext(selectedPet: Pet): PetContextValue {
  return {
    pets,
    selectedPet,
    isLoading: false,
    isDemoMode: false,
    error: '',
    selectPet: vi.fn(),
    addPet: vi.fn(),
    updatePet: vi.fn(),
    removePet: vi.fn(),
    reloadPets: vi.fn(),
  }
}

function page(context: PetContextValue) {
  return (
    <MemoryRouter>
      <PetContext.Provider value={context}>
        <HealthDiaryPage />
      </PetContext.Provider>
    </MemoryRouter>
  )
}

describe('HealthDiaryPage backend integration flow', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 7, 18, 12))
    apiMocks.getDiaryEntries.mockResolvedValue([])
    apiMocks.getMonthlyPredictions.mockResolvedValue([])
    apiMocks.getVitalRecords.mockResolvedValue([])
    apiMocks.getQuestionnaires.mockResolvedValue([])
    apiMocks.getHealthAlerts.mockResolvedValue([])
    apiMocks.getWeeklyReports.mockResolvedValue([])
    apiMocks.deleteDiaryEntry.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('loads monthly diary and keeps guardian GOOD separate from latest AI CAUTION', async () => {
    apiMocks.getDiaryEntries.mockResolvedValue([diaryEntry('GOOD')])
    apiMocks.getMonthlyPredictions.mockResolvedValue([
      { predictionId: 1, questionnaireId: 1, abnormalProbability: 0.3, riskGrade: 'WATCH', primaryRiskFactor: null, riskFactorsJson: null, aiSummary: null, modelVersion: '1', predictedAt: '2026-08-18T09:00:00' },
      { predictionId: 2, questionnaireId: 2, abnormalProbability: 0.6, riskGrade: 'CAUTION', primaryRiskFactor: 'activityLevel', riskFactorsJson: null, aiSummary: '최근 AI 주의 결과', modelVersion: '1', predictedAt: '2026-08-18T14:00:00' },
    ])

    render(page(petContext(pets[0])))

    expect(await screen.findByText('AI 예측: 주의')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /8월 18일, 좋음/ })).toBeInTheDocument()
    expect(screen.getByText('최근 AI 주의 결과')).toBeInTheDocument()
  })

  it('reloads diary when pet or displayed month changes', async () => {
    const result = render(page(petContext(pets[0])))

    await waitFor(() => expect(apiMocks.getDiaryEntries).toHaveBeenCalledWith(1, 2026, 8, expect.any(AbortSignal)))

    result.rerender(page(petContext(pets[1])))
    await waitFor(() => expect(apiMocks.getDiaryEntries).toHaveBeenCalledWith(2, 2026, 8, expect.any(AbortSignal)))

    fireEvent.click(screen.getByRole('button', { name: '이전 달' }))
    await waitFor(() => expect(apiMocks.getDiaryEntries).toHaveBeenCalledWith(2, 2026, 7, expect.any(AbortSignal)))
  })

  it('sends GOOD creation and WATCH update to the same PUT date', async () => {
    apiMocks.upsertDiaryEntry
      .mockResolvedValueOnce({ ...diaryEntry('GOOD'), note: '좋은 하루' })
      .mockResolvedValueOnce({ ...diaryEntry('WATCH'), note: '좋은 하루' })

    render(page(petContext(pets[0])))
    await waitFor(() => expect(apiMocks.getDiaryEntries).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('radio', { name: /좋음/ }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '좋은 하루' } })
    fireEvent.click(screen.getByRole('button', { name: '기록 저장' }))

    await waitFor(() => expect(apiMocks.upsertDiaryEntry).toHaveBeenCalledWith(1, '2026-08-18', { status: 'GOOD', note: '좋은 하루' }))
    await screen.findByText(/기록을 저장했습니다/)
    await waitFor(() => expect(screen.getByRole('button', { name: '기록 수정' })).toBeEnabled())

    fireEvent.click(screen.getByRole('radio', { name: /관찰 필요/ }))
    await waitFor(() => expect(screen.getByRole('radio', { name: /관찰 필요/ })).toBeChecked())
    fireEvent.click(screen.getByRole('button', { name: '기록 수정' }))

    await waitFor(() => expect(apiMocks.upsertDiaryEntry).toHaveBeenLastCalledWith(1, '2026-08-18', { status: 'WATCH', note: '좋은 하루' }))
  })

  it('deletes through the API after confirmation', async () => {
    apiMocks.getDiaryEntries.mockResolvedValue([diaryEntry()])
    render(page(petContext(pets[0])))

    fireEvent.click(await screen.findByRole('button', { name: '기록 삭제' }))
    fireEvent.click(screen.getAllByRole('button', { name: '기록 삭제' }).at(-1)!)

    await waitFor(() => expect(apiMocks.deleteDiaryEntry).toHaveBeenCalledWith(1, '2026-08-18'))
    await waitFor(() => expect(screen.queryByRole('button', { name: '기록 삭제' })).not.toBeInTheDocument())
  })

  it('keeps the existing entry when DELETE fails', async () => {
    apiMocks.getDiaryEntries.mockResolvedValue([diaryEntry()])
    apiMocks.deleteDiaryEntry.mockRejectedValue(new Error('삭제 실패'))
    render(page(petContext(pets[0])))

    fireEvent.click(await screen.findByRole('button', { name: '기록 삭제' }))
    fireEvent.click(screen.getAllByRole('button', { name: '기록 삭제' }).at(-1)!)

    expect(await screen.findByText('삭제 실패')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '기록 삭제' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /8월 18일, 좋음/ })).toBeInTheDocument()
  })

  it('renders an empty state for a month with no diary entries', async () => {
    render(page(petContext(pets[0])))

    expect(await screen.findByText('이번 달에 작성한 다이어리가 없습니다.')).toBeInTheDocument()
  })
})
