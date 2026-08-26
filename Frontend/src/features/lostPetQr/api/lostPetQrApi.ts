import { apiRequest } from '../../../shared/api/apiClient'
import type { LostPetQrProfile, PublicLostPetProfile } from '../types'

export function getLostPetQrProfile(petId: number, signal?: AbortSignal) {
  return apiRequest<LostPetQrProfile>(`/pets/${petId}/lost-qr-profile`, { signal })
}

export function createLostPetQrProfile(petId: number) {
  return apiRequest<LostPetQrProfile>(`/pets/${petId}/lost-qr-profile`, {
    method: 'POST',
  })
}

export function updateLostPetQrActive(petId: number, active: boolean) {
  return apiRequest<LostPetQrProfile>(`/pets/${petId}/lost-qr-profile/active`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  })
}

export function rotateLostPetQrToken(petId: number) {
  return apiRequest<LostPetQrProfile>(`/pets/${petId}/lost-qr-profile/rotate-token`, {
    method: 'POST',
  })
}

export function getPublicLostPetProfile(publicToken: string, signal?: AbortSignal) {
  return apiRequest<PublicLostPetProfile>(
    `/public/lost-pets/${encodeURIComponent(publicToken)}`,
    { skipAuth: true, signal },
  )
}

