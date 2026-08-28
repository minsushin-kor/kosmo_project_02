import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { getApiErrorMessage, isAbortError } from '../../../shared/api/apiClient'
import { usePets } from '../../pets/hooks/usePets'
import { getWalkAdvice } from '../api/walkAdviceApi'
import type { WalkAdvice } from '../types'
import { WalkAdviceContext, type WalkAdviceContextValue } from './WalkAdviceContext'

type WalkAdviceProviderProps = {
  children: ReactNode
}

export function WalkAdviceProvider({ children }: WalkAdviceProviderProps) {
  const { selectedPet } = usePets()
  const selectedPetId = selectedPet?.id ?? null
  const [advice, setAdvice] = useState<WalkAdvice | null>(null)
  const [advicePetId, setAdvicePetId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (selectedPetId === null) {
      setAdvice(null)
      setAdvicePetId(null)
      setIsLoading(false)
      setError('')
      return
    }

    const controller = new AbortController()
    setAdvice(null)
    setAdvicePetId(selectedPetId)
    setIsLoading(true)
    setError('')

    getWalkAdvice(selectedPetId, controller.signal)
      .then(setAdvice)
      .catch((loadError: unknown) => {
        if (isAbortError(loadError)) return
        setAdvice(null)
        setError(getApiErrorMessage(loadError, '오늘의 산책 날씨를 불러오지 못했어요.'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [selectedPetId])

  const value = useMemo<WalkAdviceContextValue>(() => ({
    petId: advicePetId,
    advice: advicePetId === selectedPetId ? advice : null,
    isLoading: selectedPetId !== null && (isLoading || advicePetId !== selectedPetId),
    error,
  }), [advice, advicePetId, error, isLoading, selectedPetId])

  return (
    <WalkAdviceContext.Provider value={value}>
      {children}
    </WalkAdviceContext.Provider>
  )
}
