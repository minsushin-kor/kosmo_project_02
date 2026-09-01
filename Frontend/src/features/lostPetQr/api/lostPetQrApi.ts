import { apiBlobRequest, apiRequest } from '../../../shared/api/apiClient'
import type {
  LostPetQrProfile,
  LostPetQrVisibility,
  PublicLostPetProfile,
} from '../types'

export function getLostPetQrProfile(petId: number, signal?: AbortSignal) {
  return apiRequest<LostPetQrProfile>(`/pets/${petId}/lost-qr-profile`, { signal })
}

export function createLostPetQrProfile(petId: number, visibility: LostPetQrVisibility) {
  return apiRequest<LostPetQrProfile>(`/pets/${petId}/lost-qr-profile`, {
    method: 'POST',
    body: JSON.stringify(visibility),
  })
}

export function updateLostPetQrVisibility(petId: number, visibility: LostPetQrVisibility) {
  return apiRequest<LostPetQrProfile>(`/pets/${petId}/lost-qr-profile/visibility`, {
    method: 'PATCH',
    body: JSON.stringify(visibility),
  })
}

export function updateLostPetQrActive(petId: number, active: boolean) {
  return apiRequest<LostPetQrProfile>(`/pets/${petId}/lost-qr-profile/active`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  })
}

export function deleteLostPetQrProfile(petId: number) {
  return apiRequest<void>(`/pets/${petId}/lost-qr-profile`, {
    method: 'DELETE',
  })
}

export function uploadLostPetQrPhoto(petId: number, image: File) {
  const formData = new FormData()
  formData.append('image', image)
  return apiRequest<LostPetQrProfile>(`/pets/${petId}/lost-qr-profile/photo`, {
    method: 'POST',
    body: formData,
  })
}

export function deleteLostPetQrPhoto(petId: number) {
  return apiRequest<LostPetQrProfile>(`/pets/${petId}/lost-qr-profile/photo`, {
    method: 'DELETE',
  })
}

export function getLostPetQrPhoto(petId: number, signal?: AbortSignal) {
  return apiBlobRequest(`/pets/${petId}/lost-qr-profile/photo`, signal)
}

export function getPublicLostPetProfile(publicToken: string, signal?: AbortSignal) {
  return apiRequest<PublicLostPetProfile>(
    `/public/lost-pets/${encodeURIComponent(publicToken)}`,
    { skipAuth: true, signal },
  )
}
