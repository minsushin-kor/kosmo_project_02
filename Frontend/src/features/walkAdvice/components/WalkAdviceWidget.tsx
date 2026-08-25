import { useEffect, useState } from 'react'
import changeableImage from '../../../assets/images/walk-advice/walk-changeable.webp'
import rainyImage from '../../../assets/images/walk-advice/walk-rainy.webp'
import sunnyImage from '../../../assets/images/walk-advice/walk-sunny.webp'
import { getWalkAdvice, getWalkAdviceMockScenario } from '../api/walkAdviceApi'
import type { WalkAdvice, WalkWeatherCondition } from '../types'
import { getWalkAdviceCopy } from '../utils/walkAdviceView'
import styles from './WalkAdviceWidget.module.css'

type WalkAdviceWidgetProps = {
  petId: number
  petName: string
}

const KMA_WEATHER_URL = 'https://www.weather.go.kr/w/index.do'

const weatherImageByCondition: Record<WalkWeatherCondition, string> = {
  SUNNY: sunnyImage,
  CHANGEABLE: changeableImage,
  RAINY: rainyImage,
}

const mockScenarioOptions: Array<{
  condition: WalkWeatherCondition
  label: string
}> = [
  { condition: 'SUNNY', label: '맑은 날' },
  { condition: 'CHANGEABLE', label: '흐린 날' },
  { condition: 'RAINY', label: '비 오는 날' },
]

export function WalkAdviceWidget({ petId, petName }: WalkAdviceWidgetProps) {
  const [mockScenario, setMockScenario] = useState<WalkWeatherCondition>(getWalkAdviceMockScenario)
  const [advice, setAdvice] = useState<WalkAdvice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    setIsLoading(true)
    setError('')

    getWalkAdvice(petId, controller.signal, mockScenario)
      .then(setAdvice)
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') {
          return
        }

        setError('오늘의 산책 날씨를 불러오지 못했어요.')
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [mockScenario, petId])

  const scenarioControls = (
    <div className={styles.scenarioControls} role="group" aria-label="목업 날씨 선택">
      {mockScenarioOptions.map((option) => (
        <button
          className={mockScenario === option.condition ? styles.activeScenario : undefined}
          type="button"
          key={option.condition}
          aria-pressed={mockScenario === option.condition}
          onClick={() => setMockScenario(option.condition)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )

  if (isLoading) {
    return (
      <div className={styles.widget}>
        {scenarioControls}
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
        {scenarioControls}
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
      {scenarioControls}
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
            <small>목업</small>
          </div>
          <p className={styles.observedAt}>{advice.observedAt}</p>
          <h2>{copy.headline}</h2>
          <p className={styles.weatherSummary}>
            <strong>{advice.temperature}°</strong>
            <span>강수 {advice.precipitationProbability}%</span>
            <span>미세먼지 {advice.airQualityLabel}</span>
          </p>
          <p className={styles.description}>{copy.description}</p>
          <span className={styles.externalLink}>기상청 날씨 자세히 보기 <i aria-hidden="true">↗</i></span>
        </div>
      </a>
    </div>
  )
}
