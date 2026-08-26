import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getApiErrorMessage } from '../../../shared/api/apiClient'
import { useAuth } from '../../auth/hooks/useAuth'
import {
  createPet,
  deletePet,
  deletePetProfileImage,
  getPets,
  updatePet as updatePetRequest,
  uploadPetProfileImage,
} from '../api/petApi'
import type { Pet } from '../types'
import { PetContext, type PetContextValue } from './PetContext'

type PetProviderProps = { children: ReactNode }

export function PetProvider({ children }: PetProviderProps) {
  const { currentUser, isAuthLoading } = useAuth()
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const selectedPet = pets.find((pet) => pet.id === selectedPetId) ?? pets[0] ?? null

  const clearPets = useCallback(() => {
    setPets([])
    setSelectedPetId(null)
    setError('')
  }, [])

  const reloadPets = useCallback(async () => {
    if (isAuthLoading) {
      setIsLoading(true)
      return
    }
    if (!currentUser) {
      clearPets()
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const loadedPets = await getPets()
      setPets(loadedPets)
      setSelectedPetId((currentId) => (
        loadedPets.some((pet) => pet.id === currentId)
          ? currentId
          : loadedPets[0]?.id ?? null
      ))
      setError('')
    } catch (loadError) {
      setPets([])
      setSelectedPetId(null)
      setError(getApiErrorMessage(loadError, '반려동물 정보를 불러오지 못했습니다.'))
    } finally {
      setIsLoading(false)
    }
  }, [clearPets, currentUser, isAuthLoading])

  useEffect(() => { void reloadPets() }, [reloadPets])

  const value = useMemo<PetContextValue>(() => ({
    pets,
    selectedPet,
    isLoading,
    error,
    selectPet: setSelectedPetId,
    addPet: async (input) => {
      const newPet = await createPet(input)
      setPets((current) => [...current, newPet])
      setSelectedPetId(newPet.id)
      return newPet
    },
    updatePet: async (pet) => {
      const savedPet = await updatePetRequest(pet)
      setPets((current) => current.map((item) => item.id === savedPet.id ? savedPet : item))
      return savedPet
    },
    uploadPetProfileImage: async (petId, image) => {
      const savedPet = await uploadPetProfileImage(petId, image)
      setPets((current) => current.map((item) => item.id === savedPet.id ? savedPet : item))
      return savedPet
    },
    deletePetProfileImage: async (petId) => {
      const savedPet = await deletePetProfileImage(petId)
      setPets((current) => current.map((item) => item.id === savedPet.id ? savedPet : item))
      return savedPet
    },
    removePet: async (petId) => {
      if (pets.length <= 1 || !pets.some((pet) => pet.id === petId)) return false
      await deletePet(petId)
      const nextPets = pets.filter((pet) => pet.id !== petId)
      setPets(nextPets)
      if (selectedPet?.id === petId) setSelectedPetId(nextPets[0]?.id ?? null)
      return true
    },
    reloadPets,
  }), [error, isLoading, pets, reloadPets, selectedPet])

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>
}
