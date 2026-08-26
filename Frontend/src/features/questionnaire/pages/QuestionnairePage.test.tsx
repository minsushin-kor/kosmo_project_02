import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { QuestionnairePage } from './QuestionnairePage'

vi.mock('../../pets/hooks/useRoutePet', () => ({
  useRoutePet: () => ({
    selectedPet: { id: 1, name: '초코' },
    routePetMissing: false,
  }),
}))

vi.mock('../api/questionnaireApi', () => ({
  createQuestionnaire: vi.fn(),
}))

vi.mock('../../predictions/api/predictionApi', () => ({
  createPrediction: vi.fn(),
}))

describe('QuestionnairePage 생체정보 입력', () => {
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
})
