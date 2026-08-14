import { createContext } from 'react'
import type { CreatePetInput, Pet } from '../types'

export type PetContextValue = {
  pets: Pet[]
  selectedPet: Pet
  selectPet: (petId: number) => void
  addPet: (pet: CreatePetInput) => Pet
  updatePet: (pet: Pet) => void
  removePet: (petId: number) => boolean
}

export const PetContext = createContext<PetContextValue | null>(null)