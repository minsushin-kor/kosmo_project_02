import { useEffect, useState } from 'react'
import {
  Link,
  useLocation,
  useParams,
} from 'react-router-dom'
import { PetSectionNav } from '../../pets/components/PetSectionNav'
import { usePets } from '../../pets/hooks/usePets'
import {
  getPrediction,
  type PredictionResponse,
  type RiskGrade,
} from '../api/predictionApi'
import common from '../../../styles/featurePage.module.css'
import styles from './PredictionResultPage.module.css'

type LocationState = {
  prediction?: PredictionResponse
  petName?: string
}

const gradeLabel: Record<RiskGrade, string> = {
  NORMAL: '정상',
  WATCH: '관찰',
  CAUTION: '주의',
  DANGER: '위험',
}

const gradeMessage: Record<RiskGrade, string> = {
  NORMAL: '현재 뚜렷한 이상 신호가 적어요.',
  WATCH: '일부 변화가 있어 상태 관찰이 필요해요.',
  CAUTION: '여러 이상 징후가 있어 주의가 필요해요.',
  DANGER: '건강 이상 가능성이 높아 빠른 확인이 필요해요.',
}

function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function PredictionResultPage() {
  const { predictionId } = useParams()
  const location = useLocation()
  const { selectedPet } = usePets()

  const locationState =
    location.state as LocationState | null

  const [prediction, setPrediction] =
    useState<PredictionResponse | null>(
      locationState?.prediction ?? null,
    )

  const [isLoading, setIsLoading] =
    useState(!locationState?.prediction)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    if (prediction) {
      return
    }

    const id = Number(predictionId)

    if (!predictionId || Number.isNaN(id)) {
      setError('예측 결과 번호가 올바르지 않습니다.')
      setIsLoading(false)
      return
    }

    const loadPrediction = async () => {
      try {
        setIsLoading(true)

        const result = await getPrediction(id)

        setPrediction(result)
      } catch (loadError) {
        console.error(
          '예측 결과 조회 실패:',
          loadError,
        )

        setError(
          '예측 결과를 불러오지 못했습니다.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    void loadPrediction()
  }, [prediction, predictionId])

  if (isLoading) {
    return (
      <div className={common.page}>
        <PetSectionNav />
        <p>AI 분석 결과를 불러오는 중입니다.</p>
      </div>
    )
  }

  if (error || !prediction) {
    return (
      <div className={common.page}>
        <PetSectionNav />

        <header className={common.header}>
          <div>
            <p className={common.eyebrow}>
              AI HEALTH CHECK RESULT
            </p>

            <h1 className={common.title}>
              분석 결과를 확인할 수 없습니다.
            </h1>

            <p className={common.description}>
              {error ??
                '예측 결과가 존재하지 않습니다.'}
            </p>
          </div>
        </header>
      </div>
    )
  }

  const petName =
    locationState?.petName ??
    selectedPet.name

  const petBase = `/pets/${selectedPet.id}`

  const probability = Math.round(
    prediction.abnormalProbability * 100,
  )

  const grade =
    gradeLabel[prediction.riskGrade]

  const summary =
    prediction.aiSummary?.trim() ||
    gradeMessage[prediction.riskGrade]

  return (
    <div className={common.page}>
      <PetSectionNav />

      <header className={common.header}>
        <div>
          <p className={common.eyebrow}>
            AI HEALTH CHECK RESULT
          </p>

          <h1 className={common.title}>
            {petName}의 분석 결과
          </h1>

          <p className={common.description}>
            오늘 입력한 건강 문진과 최근 생체정보를
            바탕으로 건강 이상 가능성을 분석했습니다.
          </p>
        </div>

        <span className={common.mockBadge}>
          실제 AI 분석 결과
        </span>
      </header>

      <section
        className={styles.resultHero}
        aria-label="AI 예측 요약"
      >
        <div
          className={styles.riskGauge}
          aria-label={`건강 이상 가능성 ${probability}퍼센트`}
          style={{
            background: `conic-gradient(
              var(--color-secondary) 0 ${probability}%,
              rgba(255, 255, 255, 0.14) ${probability}% 100%
            )`,
          }}
        >
          <div
            className={styles.riskGaugeInner}
          >
            <strong>{probability}%</strong>

            <span>
              건강 이상 가능성
            </span>
          </div>
        </div>

        <div className={styles.resultCopy}>
          <span
            className={styles.watchBadge}
          >
            {grade}
          </span>

          <h2>
            {
              gradeMessage[
              prediction.riskGrade
              ]
            }
          </h2>

          <p>
            {summary}
          </p>

          <div className={styles.metadata}>
            <span>
              분석 시각
              <strong>
                {formatDateTime(
                  prediction.predictedAt,
                )}
              </strong>
            </span>

            <span>
              모델 버전
              <strong>
                {prediction.modelVersion}
              </strong>
            </span>
          </div>
        </div>
      </section>

      <div className={styles.resultGrid}>
        <section
          className={`${common.panel} ${styles.factorPanel}`}
        >
          <h2
            className={common.sectionTitle}
          >
            주요 위험 요인
          </h2>

          <p>
            AI 분석에서 가장 주요하게 확인된
            요인입니다.
          </p>

          <div className={styles.factorList}>
            <div className={styles.factor}>
              <div>
                <span>
                  {prediction.primaryRiskFactor ||
                    '특별한 주요 위험 요인 없음'}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          className={`${common.panel} ${styles.guidePanel}`}
        >
          <h2
            className={common.sectionTitle}
          >
            AI 분석 설명
          </h2>

          <p
            style={{
              whiteSpace: 'pre-line',
              lineHeight: 1.7,
            }}
          >
            {summary}
          </p>
        </section>
      </div>

      <aside className={styles.disclaimer}>
        <strong>
          꼭 확인해 주세요
        </strong>

        <p>
          이 결과는 질병을 진단하지 않습니다.
          호흡 곤란, 의식 저하, 반복되는 구토 등
          응급 증상이 있으면 결과와 관계없이
          즉시 동물병원을 방문하세요.
        </p>
      </aside>

      <div className={styles.actions}>
        <Link
          className={common.secondaryButton}
          to={`${petBase}/history`}
        >
          지난 결과 보기
        </Link>

        <Link
          className={common.primaryButton}
          to={`${petBase}/questionnaire`}
        >
          문진 다시 하기
        </Link>
      </div>
    </div>
  )
}