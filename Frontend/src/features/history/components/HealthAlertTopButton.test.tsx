import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HealthAlertTopButton } from './HealthAlertTopButton'

const api = vi.hoisted(() => ({
  useHealthAlerts: vi.fn(),
}))

vi.mock('../hooks/useHealthAlerts', () => ({
  useHealthAlerts: api.useHealthAlerts,
}))

describe('HealthAlertTopButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.useHealthAlerts.mockReturnValue({
      alerts: [],
      unreadCount: 0,
      isLoading: false,
      error: '',
    })
  })

  it('알림 페이지로 연결하고 읽지 않은 알림 수만 표시한다', async () => {
    api.useHealthAlerts.mockReturnValue({
      alerts: [],
      unreadCount: 2,
      isLoading: false,
      error: '',
    })

    render(
      <MemoryRouter>
        <HealthAlertTopButton petId={1} petName="초코" />
      </MemoryRouter>,
    )

    const link = await screen.findByRole('link', { name: /읽지 않은 알림 2건/ })
    expect(link).toHaveAttribute('href', '/pets/1/history?tab=alerts')
    expect(link).toHaveTextContent('2')
  })

  it('알림 조회가 실패해도 이동 버튼은 유지한다', async () => {
    api.useHealthAlerts.mockReturnValue({
      alerts: [],
      unreadCount: 0,
      isLoading: false,
      error: '알림 조회 실패',
    })

    render(
      <MemoryRouter>
        <HealthAlertTopButton petId={1} petName="초코" />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('link', { name: /알림 수를 확인하지 못했습니다/ })).toHaveAttribute(
      'href',
      '/pets/1/history?tab=alerts',
    )
  })
})
