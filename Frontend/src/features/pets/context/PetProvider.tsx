import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getApiErrorMessage } from '../../../shared/api/apiClient'
import { createPet, deletePet, getPets, updatePet as updatePetRequest } from '../api/petApi'
import { mockPets } from '../data/mockPets'
import type { Pet, PetAccent } from '../types'
import { PetContext, type PetContextValue } from './PetContext'

const accents: PetAccent[] = ['sage', 'sand', 'peach']

type PetProviderProps = {
  children: ReactNode
}

export function PetProvider({ children }: PetProviderProps) {
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [error, setError] = useState('')

  const selectedPet = pets.find((pet) => pet.id === selectedPetId) ?? pets[0] ?? null

  const reloadPets = useCallback(async () => {
    setIsLoading(true)

    try {
      const loadedPets = await getPets()
      setPets(loadedPets)
      setSelectedPetId((currentId) => (
        loadedPets.some((pet) => pet.id === currentId) ? currentId : loadedPets[0]?.id ?? null
      ))
      setIsDemoMode(false)
      setError('')
    } catch (loadError) {
      setPets(mockPets)
      setSelectedPetId(mockPets[0].id)
      setIsDemoMode(true)
      setError(getApiErrorMessage(loadError, '반려동물 정보를 불러오지 못했습니다.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reloadPets()
  }, [reloadPets])

  const value = useMemo<PetContextValue>(() => ({
    pets,
    selectedPet,
    isLoading,
    isDemoMode,
    error,
    selectPet: setSelectedPetId,
    addPet: async (input) => {
      if (!isDemoMode) {
        const newPet = await createPet(input)
        setPets((currentPets) => [...currentPets, newPet])
        setSelectedPetId(newPet.id)
        return newPet
      }

      const newPet: Pet = {
        ...input,
        id: `pet-${Date.now()}`,
        accent: accents[pets.length % accents.length],
      }

      setPets((currentPets) => [...currentPets, newPet])
      setSelectedPetId(newPet.id)
      return newPet
    },
    updatePet: async (petToUpdate) => {
      const savedPet = isDemoMode ? petToUpdate : await updatePetRequest(petToUpdate)
      setPets((currentPets) => currentPets.map((pet) => (
        pet.id === savedPet.id ? savedPet : pet
      )))
      return savedPet
    },
    removePet: async (petId) => {
      if (pets.length <= 1) {
        return false
      }

      if (!isDemoMode) {
        await deletePet(petId)
      }

      const nextPets = pets.filter((pet) => pet.id !== petId)

      if (nextPets.length === pets.length) {
        return false
      }

      setPets(nextPets)

      if (selectedPet?.id === petId) {
        setSelectedPetId(nextPets[0].id)
      }

      return true
    },
    reloadPets,
  }), [error, isDemoMode, isLoading, pets, reloadPets, selectedPet])

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>
}
