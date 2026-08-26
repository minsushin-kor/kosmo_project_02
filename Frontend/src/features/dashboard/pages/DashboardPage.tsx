import {
  type CSSProperties,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router-dom'

import { DataState } from '../../../components/common/DataState'
import { TodayStatusRecorder } from '../../diary/components/TodayStatusRecorder'
import {
  getHealthAlerts,
  type HealthAlert,
} from '../../history/api/healthHistoryApi'
import { PetProfileStrip } from '../../pets/components/PetProfileStrip'
import { usePets } from '../../pets/hooks/usePets'
import {
  getPredictions,
  type HealthPrediction,
} from '../../predictions/api/predictionApi'
import {
  getQuestionnaires,
  type QuestionnaireResponse,
} from '../../questionnaire/api/questionnaireApi'
import {
  getWeeklyReports,
  type WeeklyReport,
} from '../../reports/api/reportApi'
import styles from './DashboardPage.module.css'

const weekLabels = [
  '월',
  '화',
  '수',
  '목',
  '금',
  '토',
  '일',
]

const levelLabels: Record<string, string> = {
  DECREASED: '평소보다 적음',
  LOW: '평소보다 적음',
  NORMAL: '평소와 같음',
  INCREASED: '평소보다 많음',
  HIGH: '평소보다 많음',
}

const skinLabels: Record<string, string> = {
  NORMAL: '평소와 같음',
  REDNESS: '붉어짐',
  DRY: '건조함',
  RASH: '발진',
  OTHER: '기타 증상',
}

function getObservationSummary(questionnaire: QuestionnaireResponse) {
  return [
    skinLabels[questionnaire.skinCondition],
    questionnaire.itching ? '가려움' : null,
    questionnaire.hairLoss ? '탈모' : null,
    questionnaire.vomiting ? '구토' : null,
    questionnaire.diarrhea ? '설사' : null,
  ].filter(Boolean).join(' · ')
}

function formatQuestionnaireDate(submittedAt: string) {
  const date = new Date(submittedAt)

  if (Number.isNaN(date.getTime())) {
    return '최근 문진'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function DashboardPage() {
  const {
    selectedPet,
    isLoading,
  } = usePets()

  const [
    latestQuestionnaire,
    setLatestQuestionnaire,
  ] = useState<QuestionnaireResponse | null>(
    null,
  )

  const [alerts, setAlerts] =
    useState<HealthAlert[]>([])

  const [
    latestPrediction,
    setLatestPrediction,
  ] =
    useState<HealthPrediction | null>(
      null,
    )

  const [
    latestReport,
    setLatestReport,
  ] =
    useState<WeeklyReport | null>(
      null,
    )

  const [dashboardError, setDashboardError] = useState('')

  useEffect(() => {
    if (!selectedPet) {
      setLatestQuestionnaire(null)
      setAlerts([])
      setLatestPrediction(null)
      setLatestReport(null)
      setDashboardError('')
      return
    }

    const controller =
      new AbortController()
    const petId = selectedPet.id

    async function loadDashboard() {
      const results = await Promise.allSettled([
        getQuestionnaires(petId, controller.signal),
        getHealthAlerts(petId, controller.signal),
        getPredictions(petId, controller.signal),
        getWeeklyReports(petId, controller.signal),
      ])

      if (
        controller.signal.aborted
      ) {
        return
      }

      const [questionnaireResult, alertResult, predictionResult, reportResult] = results
      const questionnaires = questionnaireResult.status === 'fulfilled' ? questionnaireResult.value : []
      const newestPrediction = predictionResult.status === 'fulfilled' ? predictionResult.value[0] ?? null : null
      const predictionQuestionnaire = newestPrediction
        ? questionnaires.find((item) => item.questionnaireId === newestPrediction.questionnaireId)
        : null

      setLatestQuestionnaire(predictionQuestionnaire ?? questionnaires[0] ?? null)
      setAlerts(alertResult.status === 'fulfilled' ? alertResult.value : [])
      setLatestPrediction(newestPrediction)
      setLatestReport(reportResult.status === 'fulfilled' ? reportResult.value[0] ?? null : null)

      const failedSections = [
        questionnaireResult.status === 'rejected' ? '건강 문진' : null,
        alertResult.status === 'rejected' ? '건강 알림' : null,
        predictionResult.status === 'rejected' ? 'AI 예측' : null,
        reportResult.status === 'rejected' ? '주간 리포트' : null,
      ].filter(Boolean)
      setDashboardError(failedSections.length > 0
        ? `${failedSections.join(', ')} 데이터를 불러오지 못했습니다. 다른 정보는 정상적으로 표시됩니다.`
        : '')
    }

    void loadDashboard()

    return () => {
      controller.abort()
    }
  }, [selectedPet])

  const unreadAlerts =
    useMemo(
      () =>
        alerts.filter(
          (alert) =>
            !alert.isRead,
        ),
      [alerts],
    )

  const latestAlert =
    unreadAlerts[0] ??
    alerts[0] ??
    null

  if (isLoading) {
    return (
      <div
        className={styles.page}
      >
        <DataState
          title="아이들의 상태를 불러오고 있습니다."
          isLoading
        />
      </div>
    )
  }

  if (!selectedPet) {
    return (
      <div
        className={styles.page}
      >
        <DataState
          title="등록된 반려동물이 없습니다."
          action={
            <Link to="/pets/new">
              반려동물 등록하기
            </Link>
          }
        />
      </div>
    )
  }

  const petBase =
    `/pets/${selectedPet.id}`

  const healthRecords = latestQuestionnaire
    ? [
      {
        label: '식욕',
        value: levelLabels[latestQuestionnaire.appetiteLevel],
        note: '문진에서 기록한 식욕 상태',
        icon: '●',
      },
      {
        label: '수분 섭취',
        value: levelLabels[latestQuestionnaire.waterIntakeLevel],
        note: '문진에서 기록한 수분 섭취 상태',
        icon: '◇',
      },
      {
        label: '활동량',
        value: levelLabels[latestQuestionnaire.activityLevel],
        note: '문진에서 기록한 활동 상태',
        icon: '↗',
      },
      {
        label: '관찰 증상',
        value: getObservationSummary(latestQuestionnaire),
        note: latestQuestionnaire.additionalSymptoms || '추가로 작성한 증상이 없습니다.',
        icon: '✦',
      },
    ]
    : [
      {
        label: '식욕',
        value: '-',
        note: '문진 기록 없음',
        icon: '●',
      },
      {
        label: '수분 섭취',
        value: '-',
        note: '문진 기록 없음',
        icon: '◇',
      },
      {
        label: '활동량',
        value: '-',
        note: '문진 기록 없음',
        icon: '↗',
      },
      {
        label: '관찰 증상',
        value: '-',
        note: '문진 기록 없음',
        icon: '✦',
      },
    ]

  const riskPercent =
    latestPrediction
      ? Math.round(
        Number(
          latestPrediction.abnormalProbability,
        ) * 100,
      )
      : null

  const healthScore =
    riskPercent == null
      ? null
      : Math.min(
        100,
        Math.max(
          0,
          100 - riskPercent,
        ),
      )

  const overallTitle =
    latestPrediction
      ? latestPrediction.riskGrade ===
        'NORMAL'
        ? '최근 기록은 정상 범위예요'
        : '최근 건강 신호를 관찰해 주세요'
      : latestQuestionnaire
        ? '최근 문진의 AI 분석을 확인해 주세요'
        : '오늘의 건강 기록을 시작해 주세요'

  const overallDescription =
    latestPrediction?.aiSummary ??
    (latestQuestionnaire
      ? '최근 문진은 저장됐지만 연결된 AI 분석 결과가 없습니다.'
      : '오늘의 건강 문진을 완료하면 AI 위험도 분석 결과가 표시됩니다.')

  const insightTitle =
    latestReport?.oneLineSummary ??
    (latestPrediction
      ? '최근 AI 예측 결과를 확인해 보세요.'
      : '건강 문진을 시작해 보세요.')

  const insightCopy =
    latestReport?.reportContent ??
    latestPrediction?.aiSummary ??
    '문진과 건강 기록이 쌓이면 AI 건강 인사이트가 표시됩니다.'

  const chartData = [0, 0, 0, 0, 0, 0, 0]

  return (
    <div className={styles.page}>
      {dashboardError && (
        <DataState title="일부 대시보드 정보를 불러오지 못했습니다." tone="error">
          {dashboardError}
        </DataState>
      )}
      <PetProfileStrip />
      <section
        className={
          styles.welcome
        }
      >
        <div>
          <h1>
            <span className={styles.eyebrow}>
              TODAY&apos;S PET WELLNESS
            </span>
            <span className={styles.welcomeTitle}>
              오늘 {selectedPet.name}의 하루를 살펴볼까요?
            </span>
          </h1>
        </div>
      </section>

      <TodayStatusRecorder />

      <section
        className={
          styles.summaryGrid
        }
        aria-label="건강 상태 요약"
      >
        <article
          className={
            styles.overallCard
          }
        >
          <div
            className={
              styles.cardHeading
            }
          >
            <div>
              <p>
                오늘의 건강 신호
              </p>

              <h2>
                {overallTitle}
              </h2>
            </div>

            <span
              className={
                styles.normalBadge
              }
            >
              {latestPrediction
                ? latestPrediction.riskGrade
                : latestQuestionnaire
                  ? '문진 완료'
                  : '기록 없음'}
            </span>
          </div>

          <div
            className={
              styles.scoreArea
            }
          >
            <div
              className={
                styles.scoreRing
              }
              aria-label={
                healthScore == null
                  ? '건강 점수 없음'
                  : `건강 점수 ${healthScore}점`
              }
              style={{
                '--score-progress': `${healthScore ?? 0}%`,
              } as CSSProperties}
            >
              <strong>
                {healthScore ??
                  '-'}
              </strong>

              <small>
                / 100
              </small>
            </div>

            <p>
              {overallDescription}
            </p>
          </div>

          <Link
            className={
              styles.darkButton
            }
            to={`${petBase}/questionnaire`}
          >
            오늘 건강 문진 시작하기
          </Link>
        </article>

        <article
          className={
            styles.noticeCard
          }
        >
          <span
            className={
              styles.noticeIcon
            }
            aria-hidden="true"
          >
            ✦
          </span>

          <div>
            <p>
              건강 알림
            </p>

            <h2>
              {unreadAlerts.length >
                0
                ? `확인하지 않은 알림 ${unreadAlerts.length}건`
                : latestAlert
                  ? latestAlert.title
                  : '새로운 알림이 없어요'}
            </h2>

            <small>
              {latestAlert?.message ??
                '현재 확인이 필요한 건강 알림이 없습니다.'}
            </small>
          </div>

          <Link
            to={`${petBase}/history`}
          >
            {unreadAlerts.length >
              0
              ? '알림 확인'
              : '알림 기록 보기'}
          </Link>
        </article>
      </section>

      <section
        className={
          styles.vitalsSection
        }
      >
        <div
          className={
            styles.sectionTitle
          }
        >
          <div>
            <p>
              LATEST HEALTH RECORD
            </p>

            <h2>
              최근 건강 기록
            </h2>
          </div>

          <Link
            to={`${petBase}/questionnaire`}
          >
            새 문진 작성{' '}
            <span
              aria-hidden="true"
            >
              →
            </span>
          </Link>
        </div>

        <div
          className={
            styles.vitalGrid
          }
        >
          {healthRecords.map(
            (record) => (
              <article
                className={
                  styles.vitalCard
                }
                key={
                  record.label
                }
              >
                <div
                  className={
                    styles.vitalTop
                  }
                >
                  <span
                    aria-hidden="true"
                  >
                    {record.icon}
                  </span>

                  <p>
                    {record.label}
                  </p>

                  <small>
                    {latestQuestionnaire
                      ? formatQuestionnaireDate(latestQuestionnaire.submittedAt)
                      : '기록 전'}
                  </small>
                </div>

                <div
                  className={styles.observationValue}
                >
                  <strong>
                    {record.value}
                  </strong>
                </div>

                <p
                  className={
                    styles.vitalNote
                  }
                >
                  {record.note}
                </p>
              </article>
            ),
          )}
        </div>
      </section>

      <section
        className={
          styles.detailGrid
        }
      >
        <article
          className={
            styles.chartCard
          }
        >
          <div
            className={
              styles.cardHeading
            }
          >
            <div>
              <p>
                WEEKLY TREND
              </p>

              <h2>
                이번 주 활동 흐름
              </h2>
            </div>

            <button
              type="button"
              disabled
            >
              활동 API 준비 필요
            </button>
          </div>

          <div
            className={
              styles.chart
            }
            aria-label="최근 7일 활동량 막대그래프"
          >
            {chartData.map(
              (
                value,
                index,
              ) => (
                <div
                  className={
                    styles.chartColumn
                  }
                  key={`${index}-${value}`}
                >
                  <div
                    className={
                      styles.chartTrack
                    }
                  >
                    <span
                      style={{
                        height:
                          `${value}%`,
                      }}
                    />
                  </div>

                  <small>
                    {
                      weekLabels[
                      index
                      ]
                    }
                  </small>
                </div>
              ),
            )}
          </div>
        </article>

        <article
          className={
            styles.insightCard
          }
        >
          <p
            className={
              styles.insightLabel
            }
          >
            AI HEALTH INSIGHT
          </p>

          <span
            className={
              styles.insightIcon
            }
            aria-hidden="true"
          >
            ◎
          </span>

          <h2>
            {insightTitle}
          </h2>

          <p>
            {insightCopy}
          </p>

          <Link
            to={`${petBase}/reports`}
          >
            주간 리포트 확인하기{' '}
            <span
              aria-hidden="true"
            >
              →
            </span>
          </Link>
        </article>
      </section>
    </div>
  )
}
