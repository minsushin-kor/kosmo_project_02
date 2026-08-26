import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TodayStatusRecorder } from './TodayStatusRecorder'

const api = vi.hoisted(() => ({
  getDiaryEntries: vi.fn(),
  upsertDiaryEntry: vi.fn(),
}))

vi.mock('../../pets/hooks/usePets', () => ({
  usePets: () => ({ selectedPet: { id: 1, name: '초코' } }),
}))

vi.mock('../api/healthDiaryApi', () => ({
  getDiaryEntries: api.getDiaryEntries,
  upsertDiaryEntry: api.upsertDiaryEntry,
}))

function getTodayKey() {
  const today = new Date()
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')
}

describe('TodayStatusRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getDiaryEntries.mockResolvedValue([])
  })

  it('측정값 없이 오늘 상태와 보호자 메모를 저장한다', async () => {
    api.upsertDiaryEntry.mockResolvedValue({
      diaryEntryId: 1,
      petId: 1,
      date: getTodayKey(),
      status: 'WATCH',
      note: '평소보다 천천히 걸었어요.',
      createdAt: '',
      updatedAt: '',
    })

    render(<MemoryRouter><TodayStatusRecorder /></MemoryRouter>)

    fireEvent.click(screen.getByRole('radio', { name: /관찰이 필요해요/ }))
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '평소보다 천천히 걸었어요.' },
    })
    fireEvent.click(screen.getByRole('button', { name: '오늘 상태 저장' }))

    await waitFor(() => expect(api.upsertDiaryEntry).toHaveBeenCalledWith(
      1,
      getTodayKey(),
      { status: 'WATCH', note: '평소보다 천천히 걸었어요.' },
    ))
    expect(await screen.findByText('초코의 오늘 상태를 저장했습니다.')).toBeInTheDocument()
  })
})
