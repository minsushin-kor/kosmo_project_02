import { createContext } from 'react'
import type { CreatePetInput, Pet } from '../types'

export type PetContextValue = {
  pets: Pet[]
  selectedPet: Pet
  selectPet: (petId: string) => void
  addPet: (pet: CreatePetInput) => Pet
  updatePet: (pet: Pet) => void
}

export const PetContext = createContext<PetContextValue | null>(null)
