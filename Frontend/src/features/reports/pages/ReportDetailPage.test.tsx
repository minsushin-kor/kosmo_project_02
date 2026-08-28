import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pet } from '../../pets/types'
import { ReportDetailPage } from './ReportDetailPage'

const api = vi.hoisted(() => ({
  getWeeklyReport: vi.fn(),
}))
const petState = vi.hoisted(() => ({
  pets: [] as Pet[],
  selectedPet: null as Pet | null,
  selectPet: vi.fn(),
}))

vi.mock('../api/reportApi', () => ({
  getWeeklyReport: api.getWeeklyReport,
}))
vi.mock('../../pets/hooks/usePets', () => ({
  usePets: () => petState,
}))

function reportPage() {
  return (
    <MemoryRouter initialEntries={['/reports/7']}>
      <Routes>
        <Route path="/reports/:reportId" element={<ReportDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ReportDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    petState.pets = []
    petState.selectedPet = null
    api.getWeeklyReport.mockResolvedValue({
      reportId: 7,
      petId: 2,
      startDate: '2026-08-17',
      endDate: '2026-08-23',
      averageTemperature: 38.3,
      averageHeartRate: 92,
      warningCount: 1,
      dangerCount: 0,
      questionnaireCount: 2,
      averageRiskProbability: 0.2,
      oneLineSummary: '건강 기록을 꾸준히 확인해 주세요.',
      reportContent: '이번 주 기록은 대체로 안정적입니다.',
      createdAt: '2026-08-24T09:00:00+09:00',
    })
  })

  it('반려동물 목록이 나중에 준비되어도 리포트는 한 번만 조회한다', async () => {
    const result = render(reportPage())

    expect(await screen.findByText('이번 주 기록은 대체로 안정적입니다.')).toBeInTheDocument()
    expect(api.getWeeklyReport).toHaveBeenCalledTimes(1)

    petState.pets = [{
      id: 2,
      name: '보리',
      species: 'CAT',
      breed: '코리안 숏헤어',
      birthDate: '2023-01-01',
      sex: 'FEMALE',
      weight: 4,
      neutered: true,
      medicalHistory: '',
      accent: 'sand',
    }]
    result.rerender(reportPage())

    await waitFor(() => expect(petState.selectPet).toHaveBeenCalledWith(2))
    expect(api.getWeeklyReport).toHaveBeenCalledTimes(1)
  })
})
