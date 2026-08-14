import { apiRequest } from '../../../lib/api'
import type { Sex, Species } from '../types'

export type PetResponse = {
    petId: number
    userId: number
    petName: string
    species: Species
    breed: string
    birthDate: string
    gender: Sex
    weight: number
    neutered: boolean
    medicalHistory: string | null
    profileImageUrl: string | null
    createdAt: string
}

export async function getPets(userId: number) {
    return apiRequest<PetResponse[]>(
        `/api/pets?userId=${userId}`,
    )
}

export async function getPet(petId: number) {
    return apiRequest<PetResponse>(
        `/api/pets/${petId}`,
    )
}