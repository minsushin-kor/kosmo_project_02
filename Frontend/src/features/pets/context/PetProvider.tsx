import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { getPets } from '../api/petApi'
import { mockPets } from '../data/mockPets'
import type { Pet, PetAccent } from '../types'
import { PetContext, type PetContextValue } from './PetContext'

const accents: PetAccent[] = ['sage', 'sand', 'peach']

const TEMP_USER_ID = 1

type PetProviderProps = {
  children: ReactNode
}

export function PetProvider({ children }: PetProviderProps) {
  const [pets, setPets] = useState<Pet[]>(mockPets)
  const [selectedPetId, setSelectedPetId] = useState<number>(
    mockPets[0].id,
  )

  useEffect(() => {
    let cancelled = false

    async function loadPets() {
      try {
        const response = await getPets(TEMP_USER_ID)

        if (cancelled || response.length === 0) {
          return
        }

        const mappedPets: Pet[] = response.map((pet, index) => ({
          id: pet.petId,
          name: pet.petName,
          species: pet.species,
          breed: pet.breed,
          birthDate: pet.birthDate,
          sex: pet.gender,
          weight: pet.weight,
          neutered: pet.neutered,
          medicalHistory: pet.medicalHistory ?? '',
          imageUrl: pet.profileImageUrl ?? undefined,
          accent: accents[index % accents.length],
        }))

        setPets(mappedPets)
        setSelectedPetId(mappedPets[0].id)
      } catch (error) {
        console.error(
          '반려동물 목록을 불러오지 못했습니다.',
          error,
        )
      }
    }

    void loadPets()

    return () => {
      cancelled = true
    }
  }, [])

  const selectedPet =
    pets.find((pet) => pet.id === selectedPetId) ??
    pets[0]

  const value = useMemo<PetContextValue>(
    () => ({
      pets,
      selectedPet,

      selectPet: setSelectedPetId,

      addPet: (input) => {
        const newPet: Pet = {
          ...input,
          id: Date.now(),
          accent: accents[pets.length % accents.length],
        }

        setPets((currentPets) => [...currentPets, newPet])
        setSelectedPetId(newPet.id)

        return newPet
      },

      updatePet: (updatedPet) => {
        setPets((currentPets) =>
          currentPets.map((pet) =>
            pet.id === updatedPet.id
              ? updatedPet
              : pet,
          ),
        )
      },

      removePet: (petId) => {
        if (pets.length <= 1) {
          return false
        }

        const nextPets = pets.filter(
          (pet) => pet.id !== petId,
        )

        if (nextPets.length === pets.length) {
          return false
        }

        setPets(nextPets)

        if (selectedPet.id === petId) {
          setSelectedPetId(nextPets[0].id)
        }

        return true
      },
    }),
    [pets, selectedPet],
  )

  return (
    <PetContext.Provider value={value}>
      {children}
    </PetContext.Provider>
  )
}