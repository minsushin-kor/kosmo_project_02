import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { HealthHistoryPage } from './HealthHistoryPage'

const api = vi.hoisted(() => ({
  getHealthAlerts: vi.fn(),
  getPredictions: vi.fn(),
}))
const selectedPet = vi.hoisted(() => ({ id: 1, name: '초코' }))

vi.mock('../../pets/hooks/useRoutePet', () => ({
  useRoutePet: () => ({
    selectedPet,
    routePetMissing: false,
  }),
}))
vi.mock('../api/healthHistoryApi', () => ({
  getHealthAlerts: api.getHealthAlerts,
  markAllHealthAlertsRead: vi.fn(),
  markHealthAlertRead: vi.fn(),
}))
vi.mock('../../predictions/api/predictionApi', () => ({ getPredictions: api.getPredictions }))

describe('HealthHistoryPage prediction 조회', () => {
  it('문진별 요청 없이 pet 기준 prediction 목록을 한 번 조회한다', async () => {
    api.getHealthAlerts.mockResolvedValue([])
    api.getPredictions.mockResolvedValue([])

    render(<MemoryRouter><HealthHistoryPage /></MemoryRouter>)

    await waitFor(() => expect(api.getPredictions).toHaveBeenCalledTimes(1))
    expect(api.getPredictions).toHaveBeenCalledWith(1, expect.any(AbortSignal))
    expect(await screen.findByText('도착한 건강 알림이 없습니다.')).toBeInTheDocument()
  })
})
