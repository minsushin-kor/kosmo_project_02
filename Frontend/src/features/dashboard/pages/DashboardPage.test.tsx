import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DashboardPage } from './DashboardPage'

const api = vi.hoisted(() => ({
  getQuestionnaires: vi.fn(),
  getHealthAlerts: vi.fn(),
  getPredictions: vi.fn(),
  getWeeklyReports: vi.fn(),
}))

vi.mock('../../pets/hooks/usePets', () => ({
  usePets: () => ({
    selectedPet: { id: 1, name: '초코' },
    isLoading: false,
  }),
}))
vi.mock('../../pets/components/PetProfileStrip', () => ({ PetProfileStrip: () => null }))
vi.mock('../../diary/components/TodayStatusRecorder', () => ({ TodayStatusRecorder: () => null }))
vi.mock('../../questionnaire/api/questionnaireApi', () => ({ getQuestionnaires: api.getQuestionnaires }))
vi.mock('../../history/api/healthHistoryApi', () => ({ getHealthAlerts: api.getHealthAlerts }))
vi.mock('../../predictions/api/predictionApi', () => ({ getPredictions: api.getPredictions }))
vi.mock('../../reports/api/reportApi', () => ({ getWeeklyReports: api.getWeeklyReports }))

describe('DashboardPage API 오류 상태', () => {
  beforeEach(() => vi.clearAllMocks())

  const questionnaire = {
    questionnaireId: 11,
    petId: 1,
    temperature: 38.5,
    heartRate: 100,
    respiratoryRate: 24,
    skinCondition: 'REDNESS',
    itching: true,
    hairLoss: false,
    vomiting: false,
    diarrhea: false,
    appetiteLevel: 'NORMAL',
    waterIntakeLevel: 'INCREASED',
    activityLevel: 'LOW',
    symptomDurationDays: 1,
    additionalSymptoms: '산책 중 자주 멈췄어요.',
    submittedAt: '2026-08-24T10:00:00',
  }

  it('한 API가 실패해도 성공한 데이터와 명시적인 오류를 함께 표시한다', async () => {
    api.getQuestionnaires.mockResolvedValue([questionnaire])
    api.getHealthAlerts.mockRejectedValue(new Error('alerts unavailable'))
    api.getPredictions.mockResolvedValue([])
    api.getWeeklyReports.mockResolvedValue([])

    render(<MemoryRouter><DashboardPage /></MemoryRouter>)

    expect(await screen.findByText('일부 대시보드 정보를 불러오지 못했습니다.')).toBeInTheDocument()
    expect(screen.getByText(/건강 알림 데이터를 불러오지 못했습니다/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('붉어짐 · 가려움')).toBeInTheDocument())
    expect(screen.getByText('평소보다 많음')).toBeInTheDocument()
    expect(screen.queryByText('문진 기록 없음')).not.toBeInTheDocument()
  })

  it('최근 문진이 없으면 기록 없음으로 표시한다', async () => {
    api.getQuestionnaires.mockResolvedValue([])
    api.getHealthAlerts.mockResolvedValue([])
    api.getPredictions.mockResolvedValue([])
    api.getWeeklyReports.mockResolvedValue([])

    render(<MemoryRouter><DashboardPage /></MemoryRouter>)

    expect(await screen.findAllByText('문진 기록 없음')).toHaveLength(4)
    expect(screen.queryByText('일부 대시보드 정보를 불러오지 못했습니다.')).not.toBeInTheDocument()
    expect(screen.queryByText('이번 주 활동 흐름')).not.toBeInTheDocument()
    expect(screen.queryByText('활동 API 준비 필요')).not.toBeInTheDocument()
    expect(screen.getByText('AI HEALTH INSIGHT')).toBeInTheDocument()
  })

  it('건강 점수만큼 원형 그래프의 진행 구간을 표시한다', async () => {
    api.getQuestionnaires.mockResolvedValue([questionnaire])
    api.getHealthAlerts.mockResolvedValue([])
    api.getPredictions.mockResolvedValue([{
      questionnaireId: 11,
      abnormalProbability: 0.3,
      riskGrade: 'NORMAL',
      aiSummary: '최근 기록은 안정적입니다.',
    }])
    api.getWeeklyReports.mockResolvedValue([])

    render(<MemoryRouter><DashboardPage /></MemoryRouter>)

    const scoreRing = await screen.findByLabelText('건강 점수 70점')
    expect(scoreRing.style.getPropertyValue('--score-progress')).toBe('70%')
  })
})
