import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { HealthPrediction } from '../../predictions/api/predictionApi'
import type { QuestionnaireResponse } from '../../questionnaire/api/questionnaireApi'
import { HealthRecordDetailPage } from './HealthRecordDetailPage'

const api = vi.hoisted(() => ({
  createPrediction: vi.fn(),
  deleteHealthRecord: vi.fn(),
  getHealthRecord: vi.fn(),
}))

vi.mock('../../pets/hooks/useRoutePet', () => ({
  useRoutePet: () => ({
    selectedPet: { id: 1, name: '초코' },
    routePetMissing: false,
  }),
}))
vi.mock('../../predictions/api/predictionApi', () => ({
  createPrediction: api.createPrediction,
}))
vi.mock('../api/healthRecordApi', () => ({
  deleteHealthRecord: api.deleteHealthRecord,
  getHealthRecord: api.getHealthRecord,
}))

const questionnaire: QuestionnaireResponse = {
  questionnaireId: 1,
  petId: 1,
  temperature: 38.4,
  heartRate: 92,
  respiratoryRate: 24,
  skinCondition: 'REDNESS',
  itching: true,
  hairLoss: false,
  vomiting: false,
  diarrhea: false,
  appetiteLevel: 'NORMAL',
  waterIntakeLevel: 'INCREASED',
  activityLevel: 'LOW',
  symptomDurationDays: 2,
  additionalSymptoms: '산책 중 자주 멈춤',
  submittedAt: '2026-08-28T10:00:00+09:00',
}

const prediction: HealthPrediction = {
  predictionId: 10,
  questionnaireId: 1,
  abnormalProbability: 0.2,
  riskGrade: 'WATCH',
  primaryRiskFactor: '활동량 변화',
  riskFactorsJson: null,
  aiSummary: '상태를 계속 관찰해 주세요.',
  modelVersion: '1.0.0',
  predictedAt: '2026-08-28T10:01:00+09:00',
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/pets/1/health-records/1']}>
      <Routes>
        <Route path="/pets/:petId/health-records/:questionnaireId" element={<HealthRecordDetailPage />} />
        <Route path="/pets/:petId/history" element={<div>건강 기록 목록 화면</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('HealthRecordDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.deleteHealthRecord.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('문진 전체 내용을 보여주고 미분석 기록을 기존 값으로 분석한다', async () => {
    api.getHealthRecord.mockResolvedValue({ questionnaire, prediction: null })
    api.createPrediction.mockResolvedValue(prediction)

    renderPage()

    expect(await screen.findByRole('heading', { name: '초코의 건강 기록' })).toBeInTheDocument()
    expect(screen.getByText('붉어짐')).toBeInTheDocument()
    expect(screen.getByText('산책 중 자주 멈춤')).toBeInTheDocument()
    expect(screen.getByText('AI 분석 전')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← 건강 기록 목록' })).toHaveAttribute(
      'href',
      '/pets/1/history?tab=history',
    )

    fireEvent.click(screen.getByRole('button', { name: 'AI 분석하기' }))

    await waitFor(() => expect(api.createPrediction).toHaveBeenCalledWith(1))
    expect(await screen.findByText('활동량 변화')).toBeInTheDocument()
    expect(screen.getByText('상태를 계속 관찰해 주세요.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'AI 결과 자세히 보기 →' })).not.toBeInTheDocument()
  })

  it('분석 완료 기록 삭제 시 연결 데이터 안내 후 목록으로 돌아간다', async () => {
    api.getHealthRecord.mockResolvedValue({ questionnaire, prediction })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderPage()

    expect(await screen.findByText('AI 분석 완료')).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: '기록 삭제' }))

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('AI 분석 결과와 건강 알림도 함께 삭제'))
    await waitFor(() => expect(api.deleteHealthRecord).toHaveBeenCalledWith(1))
    expect(await screen.findByText('건강 기록 목록 화면')).toBeInTheDocument()
  })
})
