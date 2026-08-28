import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QuestionnairePage } from './QuestionnairePage'

const api = vi.hoisted(() => ({
  createPrediction: vi.fn(),
  createQuestionnaire: vi.fn(),
}))

vi.mock('../../pets/hooks/useRoutePet', () => ({
  useRoutePet: () => ({
    selectedPet: { id: 1, name: '초코' },
    routePetMissing: false,
  }),
}))

vi.mock('../api/questionnaireApi', () => ({
  createQuestionnaire: api.createQuestionnaire,
}))

vi.mock('../../predictions/api/predictionApi', () => ({
  createPrediction: api.createPrediction,
}))

describe('QuestionnairePage 생체정보 입력', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('기본값 대신 예시만 표시하고 실제 입력 전에는 다음 단계로 이동하지 않는다', () => {
    render(<MemoryRouter><QuestionnairePage /></MemoryRouter>)

    const temperature = screen.getByRole('spinbutton', { name: /^체온/ })
    const heartRate = screen.getByRole('spinbutton', { name: /^심박수/ })
    const respiratoryRate = screen.getByRole('spinbutton', { name: /^호흡수/ })

    expect(temperature).toHaveValue(null)
    expect(heartRate).toHaveValue(null)
    expect(respiratoryRate).toHaveValue(null)
    expect(temperature).toHaveAttribute('placeholder', '예: 38.4')
    expect(screen.getByText('보다 정확한 결과를 위해 직접 측정하거나 확인한 값을 입력해 주세요.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))

    expect(screen.getByRole('alert')).toHaveTextContent('체온, 심박수, 호흡수를 모두 입력해 주세요.')
    expect(screen.queryByText('피부와 소화 상태는 어떤가요?')).not.toBeInTheDocument()

    fireEvent.change(temperature, { target: { value: '38.4' } })
    fireEvent.change(heartRate, { target: { value: '92' } })
    fireEvent.change(respiratoryRate, { target: { value: '24' } })
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))

    expect(screen.getByText('피부와 소화 상태는 어떤가요?')).toBeInTheDocument()
  })

  it('문진 저장 후 AI 분석이 실패하면 같은 문진으로 분석만 다시 시도한다', async () => {
    api.createQuestionnaire.mockResolvedValue({
      questionnaireId: 15,
      petId: 1,
      temperature: 38.4,
      heartRate: 92,
      respiratoryRate: 24,
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
      submittedAt: '2026-08-28T10:00:00+09:00',
    })
    api.createPrediction.mockRejectedValue(new Error('AI 서버 연결 실패'))

    render(<MemoryRouter><QuestionnairePage /></MemoryRouter>)

    fireEvent.change(screen.getByRole('spinbutton', { name: /^체온/ }), { target: { value: '38.4' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: /^심박수/ }), { target: { value: '92' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: /^호흡수/ }), { target: { value: '24' } })

    for (let step = 0; step < 4; step += 1) {
      fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    }

    fireEvent.click(screen.getByRole('button', { name: 'AI 분석 요청하기' }))

    expect(await screen.findByText('문진은 저장되었지만 AI 분석을 완료하지 못했습니다.')).toBeInTheDocument()
    expect(screen.getAllByText(/문진 내용은 저장되었습니다/)).toHaveLength(2)
    expect(api.createQuestionnaire).toHaveBeenCalledTimes(1)
    expect(api.createPrediction).toHaveBeenCalledWith(15)

    fireEvent.click(screen.getByRole('button', { name: 'AI 분석 다시 시도' }))

    await waitFor(() => expect(api.createPrediction).toHaveBeenCalledTimes(2))
    expect(api.createQuestionnaire).toHaveBeenCalledTimes(1)
  })
})
