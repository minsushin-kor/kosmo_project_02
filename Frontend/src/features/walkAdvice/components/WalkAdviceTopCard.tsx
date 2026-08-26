import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage, isAbortError } from '../../../shared/api/apiClient'
import { getWalkAdvice } from '../api/walkAdviceApi'
import type { WalkAdvice, WalkWeatherCondition } from '../types'
import styles from './WalkAdviceTopCard.module.css'

type WalkAdviceTopCardProps = {
  petId: number
  petName: string
}

const conditionLabels: Record<WalkWeatherCondition, string> = {
  GOOD: '산책하기 좋아요',
  CAUTION: '날씨를 살펴봐요',
  REST: '오늘은 쉬어가요',
}

function DogMoodIcon({ condition }: { condition: WalkWeatherCondition }) {
  const moodSymbol: Record<WalkWeatherCondition, string> = {
    GOOD: '☺',
    CAUTION: '?',
    REST: '☹',
  }

  return (
    <span className={styles.dogMood} aria-hidden="true">
      <span className={styles.dogEmoji}>🐶</span>
      <span className={styles.moodSymbol}>{moodSymbol[condition]}</span>
    </span>
  )
}

export function WalkAdviceTopCard({ petId, petName }: WalkAdviceTopCardProps) {
  const [advice, setAdvice] = useState<WalkAdvice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError('')

    getWalkAdvice(petId, controller.signal)
      .then(setAdvice)
      .catch((loadError: unknown) => {
        if (isAbortError(loadError)) return
        setAdvice(null)
        setError(getApiErrorMessage(loadError, '산책 날씨를 확인하지 못했어요.'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [petId])

  const condition = advice?.condition ?? 'CAUTION'
  const scoreLabel = advice ? `${advice.recommendationScore}점` : '--점'
  const statusLabel = advice ? conditionLabels[advice.condition] : isLoading ? '불러오는 중' : '확인 필요'

  return (
    <Link
      className={`${styles.topCard} ${styles[condition.toLowerCase()]}`}
      to={`/pets/${petId}/diary#walk-advice`}
      aria-busy={isLoading || undefined}
      aria-label={`${petName}의 오늘 산책 점수 ${scoreLabel}, ${statusLabel}. 건강 다이어리에서 자세히 보기`}
      title={error || statusLabel}
    >
      <DogMoodIcon condition={condition} />
      <span className={styles.label}>산책</span>
      <strong>{advice?.recommendationScore ?? '--'}<span className={styles.unit}>점</span></strong>
    </Link>
  )
}
