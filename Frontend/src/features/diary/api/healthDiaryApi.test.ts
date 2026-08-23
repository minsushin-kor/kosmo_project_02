import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  deleteDiaryEntry,
  getDiaryEntries,
  upsertDiaryEntry,
} from './healthDiaryApi'

describe('healthDiaryApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requests diary entries for the selected pet and month', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([])))
    vi.stubGlobal('fetch', fetchMock)

    await getDiaryEntries(2, 2026, 8)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/pets/2/diary?year=2026&month=8',
      expect.objectContaining({ signal: undefined }),
    )
  })

  it('uses PUT for both GOOD creation and WATCH update', async () => {
    const saved = {
      diaryEntryId: 1,
      petId: 1,
      date: '2026-08-18',
      status: 'GOOD',
      note: '',
      createdAt: '2026-08-18T09:00:00',
      updatedAt: '2026-08-18T09:00:00',
    }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(saved)))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...saved, status: 'WATCH' })))
    vi.stubGlobal('fetch', fetchMock)

    await upsertDiaryEntry(1, '2026-08-18', { status: 'GOOD', note: '좋아요' })
    await upsertDiaryEntry(1, '2026-08-18', { status: 'WATCH', note: '관찰해요' })

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/pets/1/diary/2026-08-18', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ status: 'GOOD', note: '좋아요' }),
    }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/pets/1/diary/2026-08-18', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ status: 'WATCH', note: '관찰해요' }),
    }))
  })

  it('uses DELETE for the selected date', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await deleteDiaryEntry(1, '2026-08-18')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/pets/1/diary/2026-08-18',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})
