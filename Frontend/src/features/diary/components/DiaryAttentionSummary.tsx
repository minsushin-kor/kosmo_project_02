import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { isAbortError } from '../../../shared/api/apiClient'
import type { Pet } from '../../pets/types'
import { getMonthlyPredictions, type HealthPrediction } from '../../predictions/api/predictionApi'
import { getDiaryEntries } from '../api/healthDiaryApi'
import type { DiaryEntry } from '../types'
import { parseDateKey } from '../utils/calendar'
import { getLatestPredictionsByDate } from '../utils/monthlyPredictions'
import styles from './DiaryAttentionSummary.module.css'

type DiaryAttentionSummaryProps = {
  pets: Pet[]
  selectedPetId: number
  todayKey: string
  selectedPetTodayData?: {
    entry?: DiaryEntry
    prediction?: HealthPrediction
    isLoading: boolean
    hasError: boolean
  }
}

type AttentionItem = {
  key: string
  petId: number
  petName: string
  message: string
  link: string
  tone: 'watch' | 'danger'
  type: 'ai' | 'guardian'
}

type PetTodayData = {
  entry?: DiaryEntry
  prediction?: HealthPrediction
  hasError: boolean
}

function withTopicParticle(name: string) {
  const lastCharacter = name.at(-1)
  if (!lastCharacter) return name

  const code = lastCharacter.charCodeAt(0)
  const hasBatchim = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0
  return `${name}${hasBatchim ? '은' : '는'}`
}

export function DiaryAttentionSummary({
  pets,
  selectedPetId,
  todayKey,
  selectedPetTodayData,
}: DiaryAttentionSummaryProps) {
  const [petData, setPetData] = useState<Record<number, PetTodayData>>({})
  const [isLoading, setIsLoading] = useState(true)
  const shouldFetchSelectedPet = selectedPetTodayData === undefined

  useEffect(() => {
    const petsToFetch = shouldFetchSelectedPet
      ? pets
      : pets.filter((pet) => pet.id !== selectedPetId)

    if (petsToFetch.length === 0) {
      setPetData({})
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    const today = parseDateKey(todayKey)
    const year = today.getFullYear()
    const month = today.getMonth() + 1
    setIsLoading(true)
    setPetData({})

    Promise.all(petsToFetch.map(async (pet) => {
      const [diaryResult, predictionResult] = await Promise.allSettled([
        getDiaryEntries(pet.id, year, month, controller.signal),
        getMonthlyPredictions(pet.id, year, month, controller.signal),
      ])
      const hasDiaryError = diaryResult.status === 'rejected' && !isAbortError(diaryResult.reason)
      const hasPredictionError = predictionResult.status === 'rejected' && !isAbortError(predictionResult.reason)
      const entries = diaryResult.status === 'fulfilled' ? diaryResult.value : []
      const predictions = predictionResult.status === 'fulfilled' ? predictionResult.value : []

      return [pet.id, {
        entry: entries.find((entry) => entry.date === todayKey),
        prediction: getLatestPredictionsByDate(predictions)[todayKey],
        hasError: hasDiaryError || hasPredictionError,
      }] as const
    }))
      .then((entries) => {
        if (!controller.signal.aborted) setPetData(Object.fromEntries(entries))
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [pets, selectedPetId, shouldFetchSelectedPet, todayKey])

  const combinedPetData = useMemo(() => {
    if (!selectedPetTodayData) return petData

    return {
      ...petData,
      [selectedPetId]: {
        entry: selectedPetTodayData.entry,
        prediction: selectedPetTodayData.prediction,
        hasError: selectedPetTodayData.hasError,
      },
    }
  }, [petData, selectedPetId, selectedPetTodayData])

  const attentionItems = useMemo(() => pets.flatMap((pet) => {
    const data = combinedPetData[pet.id]
    const items: AttentionItem[] = []

    if (data?.prediction?.riskGrade === 'CAUTION') {
      items.push({
        key: `${pet.id}-caution`,
        petId: pet.id,
        petName: pet.name,
        message: 'AI 분석 결과가 주의라서 확인이 필요한 기록이 있어요.',
        link: `/pets/${pet.id}/health-records/${data.prediction.questionnaireId}`,
        tone: 'watch',
        type: 'ai',
      })
    } else if (data?.prediction?.riskGrade === 'DANGER') {
      items.push({
        key: `${pet.id}-danger`,
        petId: pet.id,
        petName: pet.name,
        message: 'AI 분석 결과가 위험이라서 빠른 확인이 필요해요.',
        link: `/pets/${pet.id}/health-records/${data.prediction.questionnaireId}`,
        tone: 'danger',
        type: 'ai',
      })
    }

    if (data?.entry?.status === 'WATCH') {
      items.push({
        key: `${pet.id}-guardian-watch`,
        petId: pet.id,
        petName: pet.name,
        message: `보호자께서 ${withTopicParticle(pet.name)} 관찰이 필요하다고 남겨주셨어요.`,
        link: `/pets/${pet.id}/diary?date=${todayKey}`,
        tone: 'watch',
        type: 'guardian',
      })
    }

    return items
  }), [combinedPetData, pets, todayKey])

  const isSummaryLoading = isLoading || Boolean(selectedPetTodayData?.isLoading)
  const hasPartialError = Object.values(combinedPetData).some((data) => data.hasError)
  const visibleItems = attentionItems.slice(0, 2)
  const hiddenItemCount = attentionItems.length - visibleItems.length

  return (
    <section className={styles.summary} aria-labelledby="diary-attention-title" aria-live="polite">
      <header>
        <h2 id="diary-attention-title">오늘의 확인 기록</h2>
        {attentionItems.length > 0 && <span>{attentionItems.length}건</span>}
      </header>

      {isSummaryLoading ? (
        <p className={styles.empty}>아이들의 오늘 기록을 불러오는 중이에요.</p>
      ) : attentionItems.length > 0 ? (
        <ul>
          {visibleItems.map((item) => (
            <li className={item.tone === 'danger' ? styles.danger : ''} key={item.key}>
              <div className={styles.itemCopy}>
                <strong>{item.petName}</strong>
                <span>{item.message}</span>
              </div>
              {(item.type === 'ai' || item.petId !== selectedPetId) && (
                <Link className={styles.action} to={item.link}>확인하기 →</Link>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>오늘 확인이 필요한 기록은 없어요.</p>
      )}

      {!isSummaryLoading && hiddenItemCount > 0 && <p className={styles.more}>외 {hiddenItemCount}건의 확인 기록이 더 있어요.</p>}

      {!isSummaryLoading && hasPartialError && <p className={styles.error}>일부 아이의 기록은 확인하지 못했어요.</p>}
    </section>
  )
}
