import { apiRequest } from '../../../shared/api/apiClient'
import type { CreatePetInput, Pet, PetAccent } from '../types'

type PetResponse = {
  petId: number
  userId: number
  petName: string
  species: Pet['species']
  breed: string | null
  birthDate: string | null
  gender: Pet['sex'] | null
  weight: number | null
  neutered: boolean | null
  medicalHistory: string | null
  profileImageUrl: string | null
  createdAt: string
}

type PetRequest = {
  userId: number
  petName: string
  species: Pet['species']
  breed: string
  birthDate: string
  gender: Pet['sex']
  weight: number
  neutered: boolean
  medicalHistory: string
  profileImageUrl: string | null
}

const accents: PetAccent[] = ['sage', 'sand', 'peach']

export function getConfiguredUserId() {
  const parsed = Number(import.meta.env.VITE_DEMO_USER_ID ?? '1')
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

function toPet(response: PetResponse): Pet {
  return {
    id: String(response.petId),
    name: response.petName,
    species: response.species,
    breed: response.breed ?? '품종 미등록',
    birthDate: response.birthDate ?? new Date().toISOString().slice(0, 10),
    sex: response.gender ?? 'MALE',
    weight: response.weight ?? 0,
    neutered: response.neutered ?? false,
    medicalHistory: response.medicalHistory ?? '',
    imageUrl: response.profileImageUrl ?? undefined,
    accent: accents[response.petId % accents.length],
  }
}

function toRequest(input: CreatePetInput, userId: number): PetRequest {
  const persistableImage = input.imageUrl && input.imageUrl.length <= 500
    ? input.imageUrl
    : null

  return {
    userId,
    petName: input.name,
    species: input.species,
    breed: input.breed,
    birthDate: input.birthDate,
    gender: input.sex,
    weight: input.weight,
    neutered: input.neutered,
    medicalHistory: input.medicalHistory,
    profileImageUrl: persistableImage,
  }
}

export async function getPets(userId = getConfiguredUserId()) {
  const response = await apiRequest<PetResponse[]>(`/pets?userId=${userId}`)
  return response.map(toPet)
}

export async function createPet(input: CreatePetInput, userId = getConfiguredUserId()) {
  const response = await apiRequest<PetResponse>('/pets', {
    method: 'POST',
    body: JSON.stringify(toRequest(input, userId)),
  })
  return toPet(response)
}

export async function updatePet(pet: Pet, userId = getConfiguredUserId()) {
  const response = await apiRequest<PetResponse>(`/pets/${pet.id}`, {
    method: 'PUT',
    body: JSON.stringify(toRequest(pet, userId)),
  })
  return toPet(response)
}

export async function deletePet(petId: string) {
  await apiRequest<void>(`/pets/${petId}`, { method: 'DELETE' })
}
