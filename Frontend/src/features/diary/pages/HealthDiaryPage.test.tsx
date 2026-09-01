import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
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
  getMonthlyQuestionnaires: vi.fn(),
}))

vi.mock('../api/healthDiaryApi', () => ({
  getDiaryEntries: apiMocks.getDiaryEntries,
  upsertDiaryEntry: apiMocks.upsertDiaryEntry,
  deleteDiaryEntry: apiMocks.deleteDiaryEntry,
}))

vi.mock('../../predictions/api/predictionApi', () => ({
  getMonthlyPredictions: apiMocks.getMonthlyPredictions,
}))

vi.mock('../../questionnaire/api/questionnaireApi', () => ({ getMonthlyQuestionnaires: apiMocks.getMonthlyQuestionnaires }))

vi.mock('../../walkAdvice/components/WalkAdviceWidget', () => ({
  WalkAdviceWidget: () => null,
}))

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

function petContext(selectedPet: Pet, availablePets: Pet[] = pets): PetContextValue {
  return {
    pets: availablePets,
    selectedPet,
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
}

function page(context: PetContextValue, initialPath?: string) {
  const router = createMemoryRouter([
    { path: '/pets/:petId/diary', element: <HealthDiaryPage /> },
    { path: '/pets/:petId/vitals', element: <div>건강 수치 변화 화면</div> },
    { path: '/pets/:petId/health-records/:questionnaireId', element: <div>건강 기록 상세 화면</div> },
  ], { initialEntries: [initialPath ?? `/pets/${context.selectedPet?.id ?? 1}/diary`] })

  return (
    <PetContext.Provider value={context}>
      <RouterProvider router={router} />
    </PetContext.Provider>
  )
}

describe('HealthDiaryPage backend integration flow', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 7, 18, 12))
    apiMocks.getDiaryEntries.mockResolvedValue([])
    apiMocks.getMonthlyPredictions.mockResolvedValue([])
    apiMocks.getMonthlyQuestionnaires.mockResolvedValue([])
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

    expect(await screen.findByText('AI 분석 결과 · 주의')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /8월 18일, 좋음/ })).toBeInTheDocument()
    expect(screen.queryByText('최근 AI 주의 결과')).not.toBeInTheDocument()
    expect(screen.getByLabelText('건강 기록 표시')).toBeInTheDocument()
    expect(screen.getAllByText('건강 기록').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'AI 분석이 포함된 건강 기록 보기' })).toHaveAttribute(
      'href',
      '/pets/1/health-records/2',
    )
    expect(screen.queryByText('기록 없음')).not.toBeInTheDocument()
  })

  it('counts a questionnaire and its prediction as one connected health record', async () => {
    apiMocks.getMonthlyQuestionnaires.mockResolvedValue([{
      questionnaireId: 10,
      petId: 1,
      temperature: 38.2,
      heartRate: 90,
      respiratoryRate: 22,
      submittedAt: '2026-08-18T09:00:00',
    }])
    apiMocks.getMonthlyPredictions.mockResolvedValue([{
      predictionId: 20,
      questionnaireId: 10,
      abnormalProbability: 0.3,
      riskGrade: 'WATCH',
      primaryRiskFactor: null,
      riskFactorsJson: null,
      aiSummary: '관찰이 필요합니다.',
      modelVersion: '1',
      predictedAt: '2026-08-18T09:05:00',
    }])
    render(page(petContext(pets[0])))

    expect(await screen.findByText('건강 문진 1건')).toBeInTheDocument()
    const connectedHeading = screen.getByRole('heading', { name: '연결된 건강 기록' }).parentElement
    expect(connectedHeading).toHaveTextContent('1건')
    const healthRecordMetric = screen.getAllByText('건강 기록').find((element) => element.tagName === 'DT')
    expect(healthRecordMetric?.closest('div')).toHaveTextContent('1건')
    expect(screen.getByText('AI 분석 완료').closest('div')).toHaveTextContent('1건')
    expect(apiMocks.getMonthlyQuestionnaires).toHaveBeenCalledWith(1, 2026, 8, expect.any(AbortSignal))
  })

  it('reloads diary when pet or displayed month changes', async () => {
    const firstPage = render(page(petContext(pets[0])))

    await waitFor(() => expect(apiMocks.getDiaryEntries).toHaveBeenCalledWith(1, 2026, 8, expect.any(AbortSignal)))

    firstPage.unmount()
    render(page(petContext(pets[1])))
    await waitFor(() => expect(apiMocks.getDiaryEntries).toHaveBeenCalledWith(2, 2026, 8, expect.any(AbortSignal)))

    fireEvent.click(screen.getByRole('button', { name: '이전 달' }))
    await waitFor(() => expect(apiMocks.getDiaryEntries).toHaveBeenCalledWith(2, 2026, 7, expect.any(AbortSignal)))
  })

  it('sends GOOD creation and WATCH update to the same PUT date', async () => {
    const goodEntry = { ...diaryEntry('GOOD'), note: '좋은 하루' }
    const watchEntry = { ...diaryEntry('WATCH'), note: '좋은 하루' }
    apiMocks.upsertDiaryEntry
      .mockImplementationOnce(() => {
        apiMocks.getDiaryEntries.mockResolvedValue([goodEntry])
        return Promise.resolve(goodEntry)
      })
      .mockImplementationOnce(() => {
        apiMocks.getDiaryEntries.mockResolvedValue([watchEntry])
        return Promise.resolve(watchEntry)
      })

    render(page(petContext(pets[0])))
    await waitFor(() => expect(apiMocks.getDiaryEntries).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '오늘의 하루 기록하기' }))
    fireEvent.click(screen.getByRole('radio', { name: /좋음/ }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '좋은 하루' } })
    fireEvent.click(screen.getByRole('button', { name: '하루 기록하기' }))

    await waitFor(() => expect(apiMocks.upsertDiaryEntry).toHaveBeenCalledWith(1, '2026-08-18', { status: 'GOOD', note: '좋은 하루' }))
    await screen.findByText(/하루를 기록했어요/)
    fireEvent.click(screen.getByRole('button', { name: '다이어리 열기' }))

    fireEvent.click(screen.getByRole('radio', { name: /관찰 필요/ }))
    await waitFor(() => expect(screen.getByRole('radio', { name: /관찰 필요/ })).toBeChecked())
    fireEvent.click(screen.getByRole('button', { name: '수정 완료' }))

    await waitFor(() => expect(apiMocks.upsertDiaryEntry).toHaveBeenLastCalledWith(1, '2026-08-18', { status: 'WATCH', note: '좋은 하루' }))
  })

  it('opens the requested date diary editor from an edit link', async () => {
    apiMocks.getDiaryEntries.mockResolvedValue([{
      ...diaryEntry('WATCH'),
      date: '2026-08-17',
      note: '수정할 기록',
    }])

    render(page(
      petContext(pets[0]),
      '/pets/1/diary?date=2026-08-17&edit=true',
    ))

    expect(await screen.findByRole('dialog')).toHaveAccessibleName('8월 17일 월요일')
    expect(screen.getByRole('textbox')).toHaveValue('수정할 기록')
    expect(screen.getByRole('button', { name: '수정 완료' })).toBeInTheDocument()
  })

  it('일기장에 입력한 줄바꿈을 다이어리 메모에 유지한다', async () => {
    const savedEntry = { ...diaryEntry('GOOD'), note: '첫째 줄\n둘째 줄' }
    apiMocks.upsertDiaryEntry.mockImplementation(() => {
      apiMocks.getDiaryEntries.mockResolvedValue([savedEntry])
      return Promise.resolve(savedEntry)
    })
    render(page(petContext(pets[0])))
    await waitFor(() => expect(apiMocks.getDiaryEntries).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '오늘의 하루 기록하기' }))
    fireEvent.click(screen.getByRole('radio', { name: /좋음/ }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '첫째 줄\n둘째 줄' } })
    fireEvent.click(screen.getByRole('button', { name: '하루 기록하기' }))

    await waitFor(() => expect(apiMocks.upsertDiaryEntry).toHaveBeenCalledWith(1, '2026-08-18', {
      status: 'GOOD',
      note: '첫째 줄\n둘째 줄',
    }))
    expect(await screen.findByText((content) => content.includes('첫째 줄') && content.includes('둘째 줄'))).toBeInTheDocument()
  })

  it('deletes through the API after confirmation', async () => {
    apiMocks.getDiaryEntries.mockResolvedValue([diaryEntry()])
    apiMocks.deleteDiaryEntry.mockImplementation(() => {
      apiMocks.getDiaryEntries.mockResolvedValue([])
      return Promise.resolve()
    })
    render(page(petContext(pets[0])))

    fireEvent.click(await screen.findByRole('button', { name: '다이어리 열기' }))
    fireEvent.click(screen.getByRole('button', { name: '기록 삭제' }))
    fireEvent.click(screen.getAllByRole('button', { name: '기록 삭제' }).at(-1)!)

    await waitFor(() => expect(apiMocks.deleteDiaryEntry).toHaveBeenCalledWith(1, '2026-08-18'))
    await waitFor(() => expect(screen.queryByRole('button', { name: '기록 삭제' })).not.toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '이전 달' }))
    expect(screen.queryByRole('heading', { name: '작성 중인 내용이 저장되지 않았습니다.' })).not.toBeInTheDocument()
    await waitFor(() => expect(apiMocks.getDiaryEntries).toHaveBeenCalledWith(1, 2026, 7, expect.any(AbortSignal)))
  })

  it('keeps the existing entry when DELETE fails', async () => {
    apiMocks.getDiaryEntries.mockResolvedValue([diaryEntry()])
    apiMocks.deleteDiaryEntry.mockRejectedValue(new Error('삭제 실패'))
    render(page(petContext(pets[0])))

    fireEvent.click(await screen.findByRole('button', { name: '다이어리 열기' }))
    fireEvent.click(screen.getByRole('button', { name: '기록 삭제' }))
    fireEvent.click(screen.getAllByRole('button', { name: '기록 삭제' }).at(-1)!)

    expect(await screen.findByText('삭제 실패')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '기록 삭제' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /8월 18일, 좋음/ })).toBeInTheDocument()
  })

  it('keeps one monthly status card and removes the duplicated diary list', async () => {
    render(page(petContext(pets[0])))

    expect(await screen.findByText('이번 달 기록률')).toBeInTheDocument()
    expect(screen.queryByText('이번 달 다이어리')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'CSV 저장' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '기록 요약 인쇄' })).not.toBeInTheDocument()
  })

  it('uses the selected date copy and protects an unsaved note before closing the diary', async () => {
    render(page(petContext(pets[0])))
    await waitFor(() => expect(apiMocks.getDiaryEntries).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: /^8월 17일/ }))
    fireEvent.click(screen.getByRole('button', { name: '이날의 하루 기록하기' }))
    expect(screen.getByText(/8월 17일.*초코는 어땠나요/)).toBeInTheDocument()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '저장 전 메모' } })
    fireEvent.click(screen.getByRole('button', { name: '일기장 닫기' }))

    expect(screen.getByRole('heading', { name: '작성 중인 내용이 저장되지 않았습니다.' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(screen.getByRole('textbox')).toHaveValue('저장 전 메모')

    fireEvent.click(screen.getByRole('button', { name: '일기장 닫기' }))
    fireEvent.click(screen.getByRole('button', { name: '저장하지 않고 닫기' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /^8월 16일/ }))
    fireEvent.click(screen.getByRole('button', { name: '이날의 하루 기록하기' }))
    expect(screen.getByText(/8월 16일.*초코는 어땠나요/)).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('shows a retryable partial error instead of treating failed health data as empty', async () => {
    apiMocks.getMonthlyQuestionnaires.mockRejectedValue(new Error('문진 조회 실패'))
    apiMocks.getMonthlyPredictions.mockResolvedValue([{
      predictionId: 20,
      questionnaireId: 10,
      abnormalProbability: 0.3,
      riskGrade: 'NORMAL',
      primaryRiskFactor: null,
      riskFactorsJson: null,
      aiSummary: null,
      modelVersion: '1',
      predictedAt: '2026-08-18T09:05:00',
    }])

    render(page(petContext(pets[0])))

    expect(await screen.findByText(/건강 문진을 불러오지 못했습니다/)).toBeInTheDocument()
    expect(screen.getByText('AI 분석 결과 · 정상')).toBeInTheDocument()
    expect(screen.queryByText('이 날짜에 건강 문진이나 AI 분석 결과가 없습니다.')).not.toBeInTheDocument()
  })

  it('disables editing after a diary load failure and restores it through retry', async () => {
    apiMocks.getDiaryEntries.mockRejectedValue(new Error('다이어리 조회 실패'))

    render(page(petContext(pets[0])))

    expect(await screen.findByText(/기존 기록을 확인할 때까지 작성 기능을 잠시 사용할 수 없습니다/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '오늘의 하루 기록하기' })).toBeDisabled()

    apiMocks.getDiaryEntries.mockResolvedValue([])
    fireEvent.click(screen.getByRole('button', { name: '다시 불러오기' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '오늘의 하루 기록하기' })).toBeEnabled())
  })

  it('전체 카드 없이 프로필을 최대 3개씩 보여준다', async () => {
    const fourPets: Pet[] = [
      ...pets,
      { id: 3, name: '콩이', species: 'DOG', breed: '말티즈', birthDate: '2024-01-01', sex: 'FEMALE', weight: 3, neutered: false, medicalHistory: '', accent: 'peach' },
      { id: 4, name: '두부', species: 'CAT', breed: '러시안블루', birthDate: '2021-01-01', sex: 'MALE', weight: 5, neutered: true, medicalHistory: '', accent: 'sage' },
    ]

    render(page(petContext(fourPets[0], fourPets)))

    expect(screen.queryByRole('button', { name: '전체 반려동물 보기' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이전 반려동물 보기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다음 반려동물 보기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '초코 선택' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('현재 아이의 관찰 기록은 이동 링크를 숨기고 다른 아이의 기록만 확인할 수 있게 한다', async () => {
    apiMocks.getDiaryEntries.mockImplementation((petId: number) => Promise.resolve([{
      ...diaryEntry('WATCH'),
      petId,
    }]))

    render(page(petContext(pets[0])))

    expect((await screen.findByText('보호자께서 초코는 관찰이 필요하다고 남겨주셨어요.')).closest('a')).toBeNull()
    const actions = screen.getAllByRole('link', { name: '확인하기 →' })
    expect(actions).toHaveLength(1)
    expect(actions[0]).toHaveAttribute('href', '/pets/2/diary?date=2026-08-18')
  })
})
