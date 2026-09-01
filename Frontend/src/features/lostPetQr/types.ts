import type { Species } from '../pets/types'

export type LostPetQrVisibility = {
  showGuardianName: boolean
  showPetDetails: boolean
  showMedicalHistory: boolean
}

export type LostPetQrProfile = {
  publicToken: string
  active: boolean
  guardianName: string
  guardianPhone: string | null
  petName: string
  species: Species
  breed: string | null
  medicalHistory: string | null
  photoUrl: string | null
  customPhoto: boolean
} & LostPetQrVisibility

export type PublicLostPetProfile = {
  guardianName?: string
  guardianPhone: string
  petName: string
  species?: Species
  breed?: string
  medicalHistory?: string
  photoUrl?: string
}
