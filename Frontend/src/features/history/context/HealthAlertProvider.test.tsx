import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useHealthAlerts } from '../hooks/useHealthAlerts'
import { HealthAlertProvider } from './HealthAlertProvider'

const api = vi.hoisted(() => ({
  getHealthAlerts: vi.fn(),
  markHealthAlertRead: vi.fn(),
  markAllHealthAlertsRead: vi.fn(),
}))

vi.mock('../../pets/hooks/usePets', () => ({
  usePets: () => ({ selectedPet: { id: 1, name: '초코' } }),
}))
vi.mock('../api/healthHistoryApi', () => api)

function AlertConsumer({ label }: { label: string }) {
  const { unreadCount, markAlertRead } = useHealthAlerts()
  return (
    <div>
      <span>{label}: {unreadCount}</span>
      <button type="button" onClick={() => void markAlertRead(10)}>읽음</button>
    </div>
  )
}

describe('HealthAlertProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getHealthAlerts.mockResolvedValue([{
      alertId: 10,
      petId: 1,
      predictionId: 20,
      questionnaireId: 30,
      alertType: 'PREDICTION',
      severity: 'CAUTION',
      title: '주의가 필요합니다.',
      message: '건강 기록을 확인해 주세요.',
      isRead: false,
      createdAt: '2026-08-28T17:00:00+09:00',
    }])
    api.markHealthAlertRead.mockResolvedValue({
      alertId: 10,
      petId: 1,
      predictionId: 20,
      questionnaireId: 30,
      alertType: 'PREDICTION',
      severity: 'CAUTION',
      title: '주의가 필요합니다.',
      message: '건강 기록을 확인해 주세요.',
      isRead: true,
      createdAt: '2026-08-28T17:00:00+09:00',
    })
  })

  it('여러 화면이 같은 조회 결과와 읽음 상태를 공유한다', async () => {
    render(
      <HealthAlertProvider>
        <AlertConsumer label="상단" />
        <AlertConsumer label="페이지" />
      </HealthAlertProvider>,
    )

    expect(await screen.findByText('상단: 1')).toBeInTheDocument()
    expect(screen.getByText('페이지: 1')).toBeInTheDocument()
    expect(api.getHealthAlerts).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getAllByRole('button', { name: '읽음' })[0])

    await waitFor(() => {
      expect(screen.getByText('상단: 0')).toBeInTheDocument()
      expect(screen.getByText('페이지: 0')).toBeInTheDocument()
    })
  })
})
