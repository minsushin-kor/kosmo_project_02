import { createContext } from 'react'
import type { CreatePetInput, Pet } from '../types'

export type PetContextValue = {
  pets: Pet[]
  selectedPet: Pet | null
  isLoading: boolean
  isDemoMode: boolean
  error: string
  selectPet: (petId: string) => void
  addPet: (pet: CreatePetInput) => Promise<Pet>
  updatePet: (pet: Pet) => Promise<Pet>
  removePet: (petId: string) => Promise<boolean>
  reloadPets: () => Promise<void>
}

export const PetContext = createContext<PetContextValue | null>(null)
