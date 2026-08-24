import { apiRequest } from '../../../shared/api/apiClient'
import type {
  DiaryEntry,
  UpsertDiaryEntryRequest,
} from '../types'

export function getDiaryEntries(
  petId: number,
  year: number,
  month: number,
  signal?: AbortSignal,
) {
  return apiRequest<DiaryEntry[]>(
    `/pets/${petId}/diary?year=${year}&month=${month}`,
    { signal },
  )
}

export function upsertDiaryEntry(
  petId: number,
  date: string,
  request: UpsertDiaryEntryRequest,
) {
  return apiRequest<DiaryEntry>(
    `/pets/${petId}/diary/${date}`,
    {
      method: 'PUT',
      body: JSON.stringify(request),
    },
  )
}

export function deleteDiaryEntry(
  petId: number,
  date: string,
) {
  return apiRequest<void>(
    `/pets/${petId}/diary/${date}`,
    { method: 'DELETE' },
  )
}
