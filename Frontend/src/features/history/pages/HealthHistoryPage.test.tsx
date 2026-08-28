import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { HealthRecordPage } from '../api/healthRecordApi'
import type { HealthAlert } from '../api/healthHistoryApi'
import { HealthHistoryPage } from './HealthHistoryPage'

const api = vi.hoisted(() => ({
  getHealthRecords: vi.fn(),
  markAlertRead: vi.fn(),
  markAllAlertsRead: vi.fn(),
}))
const alertState = vi.hoisted(() => ({
  alerts: [] as HealthAlert[],
  unreadCount: 0,
  isLoading: false,
  error: '',
}))
const selectedPet = vi.hoisted(() => ({ id: 1, name: '초코' }))

vi.mock('../../pets/hooks/useRoutePet', () => ({
  useRoutePet: () => ({
    selectedPet,
    routePetMissing: false,
  }),
}))
vi.mock('../hooks/useHealthAlerts', () => ({
  useHealthAlerts: () => ({
    ...alertState,
    markAlertRead: api.markAlertRead,
    markAllAlertsRead: api.markAllAlertsRead,
  }),
}))
vi.mock('../api/healthRecordApi', () => ({
  getHealthRecords: api.getHealthRecords,
}))

function pageResponse(overrides: Partial<HealthRecordPage> = {}): HealthRecordPage {
  return {
    content: [],
    page: 0,
    size: 6,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
    unanalyzedCount: 0,
    ...overrides,
  }
}

describe('HealthHistoryPage 건강 기록 페이징', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    alertState.alerts = []
    alertState.unreadCount = 0
    alertState.isLoading = false
    alertState.error = ''
    api.getHealthRecords.mockResolvedValue(pageResponse())
  })

  it('알림 탭에서는 건강 기록 API를 호출하지 않는다', async () => {
    render(<MemoryRouter><HealthHistoryPage /></MemoryRouter>)

    expect(await screen.findByText('도착한 건강 알림이 없습니다.')).toBeInTheDocument()
    expect(api.getHealthRecords).not.toHaveBeenCalled()
  })

  it('알림 단계와 상세 기록 링크를 표시하고 미분석 안내는 알림 탭에서 숨긴다', async () => {
    alertState.alerts = [
      {
        alertId: 1,
        petId: 1,
        predictionId: 10,
        questionnaireId: 20,
        alertType: 'PREDICTION',
        severity: 'WATCH',
        title: '건강 상태 관찰이 필요합니다.',
        message: '활동량을 살펴봐 주세요.',
        isRead: false,
        createdAt: '2026-08-28T10:00:00+09:00',
      },
      {
        alertId: 2,
        petId: 1,
        predictionId: 11,
        questionnaireId: 21,
        alertType: 'PREDICTION',
        severity: 'CAUTION',
        title: '건강 상태에 주의가 필요합니다.',
        message: '평소보다 세심히 관찰해 주세요.',
        isRead: true,
        createdAt: '2026-08-27T10:00:00+09:00',
      },
      {
        alertId: 3,
        petId: 1,
        predictionId: 12,
        questionnaireId: 22,
        alertType: 'PREDICTION',
        severity: 'DANGER',
        title: '건강 위험 신호가 감지되었습니다.',
        message: '전문가 상담을 권장합니다.',
        isRead: false,
        createdAt: '2026-08-26T10:00:00+09:00',
      },
    ]
    alertState.unreadCount = 2
    api.getHealthRecords.mockResolvedValue(pageResponse({ unanalyzedCount: 2 }))

    render(<MemoryRouter><HealthHistoryPage /></MemoryRouter>)

    expect(await screen.findByText('관찰')).toBeInTheDocument()
    expect(screen.getByText('주의')).toBeInTheDocument()
    expect(screen.getByText('위험')).toBeInTheDocument()
    expect(screen.queryByText(/AI 분석을 완료하지 않은 건강 기록이/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '건강 상태 관찰이 필요합니다. 상세 기록 보기' })).toHaveAttribute(
      'href',
      '/pets/1/health-records/20',
    )
  })

  it('간단한 정보만 담은 건강 기록 카드를 표시하고 상세 페이지로 연결한다', async () => {
    api.getHealthRecords.mockResolvedValue(pageResponse({
      content: [
        {
          questionnaireId: 1,
          submittedAt: '2026-08-28T10:00:00+09:00',
          temperature: 38.4,
          heartRate: 92,
          respiratoryRate: 24,
          additionalSymptoms: '산책 중 자주 멈춤',
          analyzed: false,
          predictionId: null,
          riskGrade: null,
          abnormalProbability: null,
        },
        {
          questionnaireId: 2,
          submittedAt: '2026-08-27T10:00:00+09:00',
          temperature: 38.2,
          heartRate: 90,
          respiratoryRate: 22,
          additionalSymptoms: null,
          analyzed: true,
          predictionId: 20,
          riskGrade: 'WATCH',
          abnormalProbability: 0.2,
        },
      ],
      totalElements: 2,
      totalPages: 1,
      unanalyzedCount: 1,
    }))

    render(
      <MemoryRouter initialEntries={['/pets/1/history?tab=history']}>
        <HealthHistoryPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('AI 분석을 완료하지 않은 건강 기록이 1건 있어요.')).toBeInTheDocument()
    expect(screen.getByText('AI 분석 전')).toBeInTheDocument()
    expect(screen.getByText('AI 분석 완료')).toBeInTheDocument()
    expect(screen.getByText('산책 중 자주 멈춤')).toBeInTheDocument()
    expect(screen.getAllByText('자세히 보기 →')).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: /건강 기록 자세히 보기/ })[0]).toHaveAttribute(
      'href',
      '/pets/1/health-records/1',
    )
    expect(screen.queryByText('피부·증상')).not.toBeInTheDocument()
  })

  it('분석 상태 필터와 페이지 번호를 API 요청에 반영한다', async () => {
    api.getHealthRecords.mockImplementation((
      _petId: number,
      requestedPage: number,
      _size: number,
      status: string,
    ) => Promise.resolve(pageResponse({
      page: requestedPage,
      totalElements: 12,
      totalPages: 2,
      first: requestedPage === 0,
      last: requestedPage === 1,
      unanalyzedCount: 12,
      content: [{
        questionnaireId: requestedPage + 1,
        submittedAt: '2026-08-28T10:00:00+09:00',
        temperature: 38.4,
        heartRate: 92,
        respiratoryRate: 24,
        additionalSymptoms: status,
        analyzed: false,
        predictionId: null,
        riskGrade: null,
        abnormalProbability: null,
      }],
    })))

    render(
      <MemoryRouter initialEntries={['/pets/1/history?tab=history']}>
        <HealthHistoryPage />
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: '분석 전' }))
    await waitFor(() => expect(api.getHealthRecords).toHaveBeenLastCalledWith(
      1,
      0,
      6,
      'PENDING',
      expect.any(AbortSignal),
    ))

    fireEvent.click(screen.getByRole('button', { name: '2' }))
    await waitFor(() => expect(api.getHealthRecords).toHaveBeenLastCalledWith(
      1,
      1,
      6,
      'PENDING',
      expect.any(AbortSignal),
    ))
  })
})
