import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { usePets } from './usePets'

export function useRoutePet() {
  const { petId } = useParams()
  const context = usePets()

  const parsedPetId = petId
    ? Number(petId)
    : null

  const routePet =
    parsedPetId !== null &&
      Number.isInteger(parsedPetId) &&
      parsedPetId > 0
      ? context.pets.find(
        (pet) =>
          pet.id === parsedPetId,
      )
      : undefined

  useEffect(() => {
    if (
      routePet &&
      context.selectedPet?.id !==
      routePet.id
    ) {
      context.selectPet(
        routePet.id,
      )
    }
  }, [
    context,
    routePet,
  ])

  return {
    ...context,
    selectedPet:
      routePet ??
      context.selectedPet,

    routePetMissing: Boolean(
      petId &&
      !context.isLoading &&
      !routePet,
    ),
  }
}