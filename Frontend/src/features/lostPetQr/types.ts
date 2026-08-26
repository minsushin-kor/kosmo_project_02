import type { Species } from '../pets/types'

export type LostPetQrProfile = {
  publicToken: string
  active: boolean
  guardianName: string
  guardianPhone: string | null
  petName: string
  species: Species
  medicalHistory: string | null
}

export type PublicLostPetProfile = {
  guardianName: string
  guardianPhone: string
  petName: string
  species: Species
  medicalHistory: string | null
}
