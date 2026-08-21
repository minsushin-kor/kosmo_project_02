import {
  useEffect,
  useState,
} from 'react'
import {
  Link,
  useLocation,
  useParams,
} from 'react-router-dom'

import { DataState } from '../../../components/common/DataState'
import { getApiErrorMessage } from '../../../shared/api/apiClient'
import { PetSectionNav } from '../../pets/components/PetSectionNav'
import { usePets } from '../../pets/hooks/usePets'
import {
  getQuestionnaire,
  type QuestionnaireResponse,
} from '../../questionnaire/api/questionnaireApi'
import {
  getPrediction,
  type HealthPrediction,
  type RiskGrade,
} from '../api/predictionApi'
import common from '../../../styles/featurePage.module.css'
import styles from './PredictionResultPage.module.css'

type LocationState = {
  prediction?: HealthPrediction
  questionnaire?: QuestionnaireResponse
  petName?: string
}

const gradeCopy: Record<
  RiskGrade,
  {
    label: string
    title: string
    fallback: string
  }
> = {
  NORMAL: {
    label: '정상',
    title: '현재 기록에서 뚜렷한 이상 신호는 낮아요.',
    fallback:
      '현재 뚜렷한 이상 신호가 적습니다. 현재 상태를 꾸준히 기록해 주세요.',
  },
  WATCH: {
    label: '관찰',
    title: '작은 변화가 이어지는지 지켜봐 주세요.',
    fallback:
      '일부 변화가 확인되어 상태 관찰이 필요합니다.',
  },
  CAUTION: {
    label: '주의',
    title: '건강 변화를 세심하게 확인해 주세요.',
    fallback:
      '여러 이상 징후가 확인되어 주의가 필요합니다.',
  },
  DANGER: {
    label: '위험',
    title: '빠른 확인이 필요한 상태입니다.',
    fallback:
      '건강 이상 가능성이 높아 빠른 확인이 필요합니다.',
  },
}

function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function PredictionResultPage() {
  const { predictionId } = useParams()
  const location = useLocation()

  const {
    pets,
    selectedPet,
    selectPet,
  } = usePets()

  const locationState =
    location.state as LocationState | null

  const [prediction, setPrediction] =
    useState<HealthPrediction | null>(
      locationState?.prediction ?? null,
    )

  const [petName, setPetName] =
    useState(
      locationState?.petName ??
      selectedPet?.name ??
      '',
    )

  const [isLoading, setIsLoading] =
    useState(!locationState?.prediction)

  const [error, setError] = useState('')

  useEffect(() => {
    if (!predictionId) {
      setError('예측 결과 ID가 없습니다.')
      setIsLoading(false)
      return
    }

    const id = Number(predictionId)

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      setError(
        '예측 결과 번호가 올바르지 않습니다.',
      )
      setIsLoading(false)
      return
    }

    /*
     * 문진 직후 location.state로 결과를 이미
     * 전달받은 경우 화면을 즉시 표시합니다.
     */
    if (
      locationState?.prediction &&
      locationState.prediction.predictionId === id
    ) {
      setPrediction(
        locationState.prediction,
      )

      if (locationState.petName) {
        setPetName(locationState.petName)
      }

      setIsLoading(false)
      return
    }

    const controller =
      new AbortController()

    setIsLoading(true)
    setError('')

    async function loadPrediction() {
      try {
        const result =
          await getPrediction(
            id,
            controller.signal,
          )

        setPrediction(result)

        const questionnaire =
          await getQuestionnaire(
            result.questionnaireId,
            controller.signal,
          )

        /*
         * Pet.id와 questionnaire.petId 모두
         * number 타입으로 통일합니다.
         */
        const predictionPet =
          pets.find(
            (pet) =>
              pet.id ===
              questionnaire.petId,
          )

        if (predictionPet) {
          selectPet(predictionPet.id)
          setPetName(
            predictionPet.name,
          )
        }
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name ===
          'AbortError'
        ) {
          return
        }

        setError(
          getApiErrorMessage(
            loadError,
            '예측 결과를 불러오지 못했습니다.',
          ),
        )
      } finally {
        setIsLoading(false)
      }
    }

    void loadPrediction()

    return () => {
      controller.abort()
    }
  }, [
    locationState,
    pets,
    predictionId,
    selectPet,
  ])

  if (isLoading) {
    return (
      <div className={common.page}>
        <DataState
          title="AI 예측 결과를 불러오는 중입니다."
          isLoading
        />
      </div>
    )
  }

  if (!prediction || error) {
    return (
      <div className={common.page}>
        <DataState
          title="예측 결과를 표시할 수 없습니다."
          tone="error"
          action={
            <Link to="/pets">
              반려동물 목록으로 이동
            </Link>
          }
        >
          {error ||
            '예측 결과가 존재하지 않습니다.'}
        </DataState>
      </div>
    )
  }

  const probability = Math.round(
    Number(
      prediction.abnormalProbability,
    ) * 100,
  )

  const copy =
    gradeCopy[prediction.riskGrade]

  const summary =
    prediction.aiSummary?.trim() ||
    copy.fallback

  const summaryParagraphs =
    summary
      .split(/\n+/)
      .map((paragraph) =>
        paragraph.trim(),
      )
      .filter(Boolean)

  const currentPet =
    pets.find(
      (pet) =>
        pet.id === selectedPet?.id,
    ) ?? selectedPet

  const displayPetName =
    petName ||
    currentPet?.name ||
    '반려동물'

  const petBase = currentPet
    ? `/pets/${currentPet.id}`
    : '/pets'

  return (
    <div className={common.page}>
      <PetSectionNav />

      <header className={common.header}>
        <div>
          <p className={common.eyebrow}>
            AI HEALTH CHECK RESULT
          </p>

          <h1 className={common.title}>
            {displayPetName}의 분석 결과
          </h1>

          <p
            className={
              common.description
            }
          >
            건강 문진과 생체정보를
            바탕으로 건강 이상 가능성을
            분석했습니다.
          </p>
        </div>

        <span
          className={common.mockBadge}
        >
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
            background:
              `conic-gradient(
                var(--color-secondary)
                0 ${probability}%,
                rgba(255, 255, 255, 0.14)
                ${probability}% 100%
              )`,
          }}
        >
          <div
            className={
              styles.riskGaugeInner
            }
          >
            <strong>
              {probability}%
            </strong>

            <span>
              건강 이상 가능성
            </span>
          </div>
        </div>

        <div
          className={
            styles.resultCopy
          }
        >
          <span
            className={
              styles.watchBadge
            }
          >
            {copy.label}
          </span>

          <h2>{copy.title}</h2>

          <p>{summary}</p>

          <div
            className={
              styles.metadata
            }
          >
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
                {
                  prediction.modelVersion
                }
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
            className={
              common.sectionTitle
            }
          >
            주요 위험 요인
          </h2>

          <p>
            AI 분석에서 주요하게
            확인된 요인입니다.
          </p>

          <div
            className={
              styles.factorList
            }
          >
            <div
              className={
                styles.factor
              }
            >
              <div>
                <span>
                  {prediction
                    .primaryRiskFactor ||
                    '특별한 주요 위험 요인 없음'}
                </span>

                <strong>
                  {copy.label}
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section
          className={`${common.panel} ${styles.guidePanel}`}
        >
          <h2
            className={
              common.sectionTitle
            }
          >
            AI 관리 가이드
          </h2>

          <ol>
            {summaryParagraphs.map(
              (
                paragraph,
                index,
              ) => (
                <li
                  key={`${paragraph}-${index}`}
                >
                  <span>
                    {String(
                      index + 1,
                    ).padStart(
                      2,
                      '0',
                    )}
                  </span>

                  <div>
                    <p>
                      {paragraph}
                    </p>
                  </div>
                </li>
              ),
            )}
          </ol>
        </section>
      </div>

      <aside
        className={
          styles.disclaimer
        }
      >
        <strong>
          꼭 확인해 주세요
        </strong>

        <p>
          이 결과는 질병을 진단하지
          않습니다. 호흡 곤란, 의식
          저하, 반복되는 구토 등 응급
          증상이 있으면 결과와 관계없이
          즉시 동물병원을 방문하세요.
        </p>
      </aside>

      <div className={styles.actions}>
        <Link
          className={
            common.secondaryButton
          }
          to={`${petBase}/history`}
        >
          지난 결과 보기
        </Link>

        <Link
          className={
            common.primaryButton
          }
          to={`${petBase}/questionnaire`}
        >
          문진 다시 하기
        </Link>
      </div>
    </div>
  )
}