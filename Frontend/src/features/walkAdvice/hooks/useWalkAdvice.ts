import { useContext } from 'react'
import { WalkAdviceContext } from '../context/WalkAdviceContext'

export function useWalkAdvice() {
  const context = useContext(WalkAdviceContext)

  if (!context) {
    throw new Error('useWalkAdvice must be used inside WalkAdviceProvider')
  }

  return context
}
