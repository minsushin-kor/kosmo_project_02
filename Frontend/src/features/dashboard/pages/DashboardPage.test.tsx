import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api/apiClient'
import { DashboardPage } from './DashboardPage'

const api = vi.hoisted(() => ({
  getLatestVital: vi.fn(),
  getHealthAlerts: vi.fn(),
  getPredictions: vi.fn(),
  getWeeklyReports: vi.fn(),
}))

vi.mock('../../pets/hooks/usePets', () => ({
  usePets: () => ({
    selectedPet: { id: 1, name: '초코' },
    isLoading: false,
    isDemoMode: false,
  }),
}))
vi.mock('../../pets/components/PetSelector', () => ({ PetSelector: () => null }))
vi.mock('../../vitals/api/vitalApi', () => ({ getLatestVital: api.getLatestVital }))
vi.mock('../../history/api/healthHistoryApi', () => ({ getHealthAlerts: api.getHealthAlerts }))
vi.mock('../../predictions/api/predictionApi', () => ({ getPredictions: api.getPredictions }))
vi.mock('../../reports/api/reportApi', () => ({ getWeeklyReports: api.getWeeklyReports }))

describe('DashboardPage API 오류 상태', () => {
  beforeEach(() => vi.clearAllMocks())

  it('한 API가 실패해도 성공한 데이터와 명시적인 오류를 함께 표시한다', async () => {
    api.getLatestVital.mockResolvedValue({
      vitalRecordId: 1,
      petId: 1,
      temperature: 38.5,
      heartRate: 100,
      respiratoryRate: 24,
      measuredAt: '2026-08-24T10:00:00',
      sourceType: 'MANUAL',
      status: 'NORMAL',
    })
    api.getHealthAlerts.mockRejectedValue(new Error('alerts unavailable'))
    api.getPredictions.mockResolvedValue([])
    api.getWeeklyReports.mockResolvedValue([])

    render(<MemoryRouter><DashboardPage /></MemoryRouter>)

    expect(await screen.findByText('일부 대시보드 정보를 불러오지 못했습니다.')).toBeInTheDocument()
    expect(screen.getByText(/건강 알림 데이터를 불러오지 못했습니다/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('38.5')).toBeInTheDocument())
    expect(screen.queryByText('측정 기록 없음')).not.toBeInTheDocument()
  })

  it('최근 생체정보 404는 오류가 아니라 기록 없음으로 표시한다', async () => {
    api.getLatestVital.mockRejectedValue(new ApiError('등록된 생체정보가 없습니다.', 404))
    api.getHealthAlerts.mockResolvedValue([])
    api.getPredictions.mockResolvedValue([])
    api.getWeeklyReports.mockResolvedValue([])

    render(<MemoryRouter><DashboardPage /></MemoryRouter>)

    expect(await screen.findAllByText('측정 기록 없음')).toHaveLength(3)
    expect(screen.queryByText('일부 대시보드 정보를 불러오지 못했습니다.')).not.toBeInTheDocument()
  })
})
