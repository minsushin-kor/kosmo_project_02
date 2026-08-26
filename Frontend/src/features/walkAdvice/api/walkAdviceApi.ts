import { apiRequest } from '../../../shared/api/apiClient'
import type { WalkAdvice } from '../types'

type ApiResponse<T> = {
  success: boolean
  data: T
}

export async function getWalkAdvice(
  petId: number,
  signal?: AbortSignal,
  location?: string,
): Promise<WalkAdvice> {
  const search = new URLSearchParams({ petId: String(petId) })
  if (location?.trim()) {
    search.set('location', location.trim())
  }

  const response = await apiRequest<ApiResponse<WalkAdvice>>(`/walk-advice?${search}`, { signal })
  return response.data
}
