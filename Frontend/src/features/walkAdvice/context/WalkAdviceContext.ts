import { createContext } from 'react'
import type { WalkAdvice } from '../types'

export type WalkAdviceContextValue = {
  petId: number | null
  advice: WalkAdvice | null
  isLoading: boolean
  error: string
}

export const WalkAdviceContext = createContext<WalkAdviceContextValue | null>(null)
