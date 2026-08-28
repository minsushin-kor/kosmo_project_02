import { type FormEvent, useEffect, useState } from 'react'
import changeableImage from '../../../assets/images/walk-advice/walk-changeable.webp'
import rainyImage from '../../../assets/images/walk-advice/walk-rainy.webp'
import sunnyImage from '../../../assets/images/walk-advice/walk-sunny.webp'
import { getApiErrorMessage, isAbortError } from '../../../shared/api/apiClient'
import { getWalkAdvice } from '../api/walkAdviceApi'
import { useWalkAdvice } from '../hooks/useWalkAdvice'
import type { WalkAdvice, WalkWeatherCondition } from '../types'
import { getWalkAdviceCopy } from '../utils/walkAdviceView'
import styles from './WalkAdviceWidget.module.css'

type WalkAdviceWidgetProps = {
  petId: number
  petName: string
}

const KMA_WEATHER_URL = 'https://www.weather.go.kr/w/index.do'

const weatherImageByCondition: Record<WalkWeatherCondition, string> = {
  GOOD: sunnyImage,
  CAUTION: changeableImage,
  REST: rainyImage,
}

export function WalkAdviceWidget({ petId, petName }: WalkAdviceWidgetProps) {
  const defaultAdvice = useWalkAdvice()
  const [locationInput, setLocationInput] = useState('')
  const [requestedLocation, setRequestedLocation] = useState<string>()
  const [requestedPetId, setRequestedPetId] = useState(petId)
  const [searchVersion, setSearchVersion] = useState(0)
  const [customAdvice, setCustomAdvice] = useState<WalkAdvice | null>(null)
  const [isCustomLoading, setIsCustomLoading] = useState(false)
  const [customError, setCustomError] = useState('')

  useEffect(() => {
    if (!requestedLocation || requestedPetId !== petId) return

    const controller = new AbortController()

    setIsCustomLoading(true)
    setCustomError('')

    getWalkAdvice(petId, controller.signal, requestedLocation)
      .then(setCustomAdvice)
      .catch((loadError: unknown) => {
        if (isAbortError(loadError)) {
          return
        }

        setCustomAdvice(null)
        setCustomError(getApiErrorMessage(loadError, '검색한 지역의 산책 날씨를 불러오지 못했어요.'))
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsCustomLoading(false)
        }
      })

    return () => controller.abort()
  }, [petId, requestedLocation, requestedPetId, searchVersion])

  useEffect(() => {
    setLocationInput('')
    setRequestedLocation(undefined)
    setRequestedPetId(petId)
    setCustomAdvice(null)
    setCustomError('')
  }, [petId])

  const handleLocationSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextLocation = locationInput.trim()
    if (nextLocation) {
      setCustomAdvice(null)
      setCustomError('')
      setIsCustomLoading(true)
      setRequestedPetId(petId)
      setRequestedLocation(nextLocation)
      setSearchVersion((current) => current + 1)
    }
  }

  const resetToMemberAddress = () => {
    setLocationInput('')
    setRequestedLocation(undefined)
    setRequestedPetId(petId)
    setCustomAdvice(null)
    setCustomError('')
  }

  const isCurrentPet = defaultAdvice.petId === petId
  const hasCustomLocation = Boolean(requestedLocation) && requestedPetId === petId
  const advice = hasCustomLocation
    ? customAdvice
    : isCurrentPet ? defaultAdvice.advice : null
  const isLoading = hasCustomLocation
    ? isCustomLoading
    : !isCurrentPet || defaultAdvice.isLoading
  const error = hasCustomLocation
    ? customError
    : isCurrentPet ? defaultAdvice.error : ''

  const locationTools = (
    <div className={styles.locationTools}>
      <form className={styles.locationForm} onSubmit={handleLocationSubmit} role="search">
        <label htmlFor={`walk-location-${petId}`}>다른 지역</label>
        <input
          id={`walk-location-${petId}`}
          type="search"
          value={locationInput}
          onChange={(event) => setLocationInput(event.target.value)}
          maxLength={120}
          placeholder="예: 부산 해운대구"
          autoComplete="off"
        />
        <button type="submit" disabled={!locationInput.trim() || isLoading}>확인</button>
      </form>
      {hasCustomLocation && (
        <button className={styles.memberLocationButton} type="button" onClick={resetToMemberAddress}>
          내 주소로 돌아가기
        </button>
      )}
    </div>
  )

  if (isLoading) {
    return (
      <div className={styles.widget}>
        {locationTools}
        <section className={styles.stateCard} aria-busy="true" aria-label="산책 날씨를 불러오는 중">
          <span className={styles.stateIllustration} aria-hidden="true" />
          <div>
            <span className={styles.stateLine} />
            <span className={styles.stateLineShort} />
          </div>
        </section>
      </div>
    )
  }

  if (!advice || error) {
    return (
      <div className={styles.widget}>
        {locationTools}
        <section className={styles.errorCard} role="status">
          <span aria-hidden="true">☁</span>
          <div>
            <strong>산책 날씨를 확인하지 못했어요.</strong>
            <small>{error || '잠시 후 다시 확인해 주세요.'}</small>
          </div>
        </section>
      </div>
    )
  }

  const copy = getWalkAdviceCopy(advice.condition, petName)

  return (
    <div className={styles.widget}>
      {locationTools}
      <a
        className={`${styles.card} ${styles[advice.condition.toLowerCase()]}`}
        href={KMA_WEATHER_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${copy.headline} 기상청 날씨를 새 탭에서 자세히 보기`}
      >
        <div className={styles.imageWrap}>
          <img src={weatherImageByCondition[advice.condition]} alt={copy.imageAlt} />
          <span>{copy.badge}</span>
        </div>

        <div className={styles.content}>
          <div className={styles.locationLine}>
            <span>{advice.location}</span>
            <small>{advice.locationSource === 'MEMBER_ADDRESS' ? '등록 주소' : '검색 지역'}</small>
          </div>
          <p className={styles.observedAt}>{advice.observedAt}</p>
          <h2>{copy.headline}</h2>
          <p className={styles.score}>산책 추천도 <strong>{advice.recommendationScore}점</strong></p>
          <p className={styles.weatherSummary}>
            <strong>{advice.temperature}°</strong>
            <span>강수 {advice.precipitationProbability}%</span>
            <span>미세먼지 {advice.airQualityLabel}</span>
          </p>
          <p className={styles.description}>{advice.recommendationReason || copy.description}</p>
          <span className={styles.externalLink}>기상청 날씨 자세히 보기 <i aria-hidden="true">↗</i></span>
        </div>
      </a>
    </div>
  )
}
