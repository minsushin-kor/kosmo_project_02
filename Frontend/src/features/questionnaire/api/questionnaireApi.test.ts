import { afterEach, describe, expect, it, vi } from 'vitest'
import { getMonthlyQuestionnaires } from './questionnaireApi'

describe('questionnaireApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requests questionnaires for only the selected month', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([])))
    vi.stubGlobal('fetch', fetchMock)

    await getMonthlyQuestionnaires(2, 2026, 8)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/pets/2/questionnaires?year=2026&month=8',
      expect.objectContaining({ signal: undefined }),
    )
  })
})
