import { useMemo, useState, type ReactNode } from 'react'
import { mockPets } from '../data/mockPets'
import type { Pet, PetAccent } from '../types'
import { PetContext, type PetContextValue } from './PetContext'

const accents: PetAccent[] = ['sage', 'sand', 'peach']

type PetProviderProps = {
  children: ReactNode
}

export function PetProvider({ children }: PetProviderProps) {
  const [pets, setPets] = useState<Pet[]>(mockPets)
  const [selectedPetId, setSelectedPetId] = useState(mockPets[0].id)

  const selectedPet = pets.find((pet) => pet.id === selectedPetId) ?? pets[0]

  const value = useMemo<PetContextValue>(() => ({
    pets,
    selectedPet,
    selectPet: setSelectedPetId,
    addPet: (input) => {
      const newPet: Pet = {
        ...input,
        id: `pet-${Date.now()}`,
        accent: accents[pets.length % accents.length],
      }

      setPets((currentPets) => [...currentPets, newPet])
      setSelectedPetId(newPet.id)
      return newPet
    },
    updatePet: (updatedPet) => {
      setPets((currentPets) => currentPets.map((pet) => (
        pet.id === updatedPet.id ? updatedPet : pet
      )))
    },
    removePet: (petId) => {
      if (pets.length <= 1) {
        return false
      }

      const nextPets = pets.filter((pet) => pet.id !== petId)

      if (nextPets.length === pets.length) {
        return false
      }

      setPets(nextPets)

      if (selectedPet.id === petId) {
        setSelectedPetId(nextPets[0].id)
      }

      return true
    },
  }), [pets, selectedPet])

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>
}
