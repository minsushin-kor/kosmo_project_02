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

type HealthRecordIconName = 'food' | 'water' | 'activity' | 'observation'

type HealthRecordCard = {
  label: string
  value: string
  note: string
  icon: HealthRecordIconName
}

function HealthRecordIcon({ name }: { name: HealthRecordIconName }) {
  const commonProps = {
    viewBox: '0 0 32 32',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
    'data-health-icon': name,
  }

  if (name === 'food') {
    return (
      <svg {...commonProps}>
        <circle cx="11" cy="14.5" r="1.7" fill="currentColor" stroke="none" />
        <circle cx="15.5" cy="12.5" r="1.9" fill="currentColor" stroke="none" />
        <circle cx="20.2" cy="14.2" r="1.7" fill="currentColor" stroke="none" />
        <circle cx="13.4" cy="16.8" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="18" cy="16.5" r="1.9" fill="currentColor" stroke="none" />
        <path d="M6.5 17.5h19l-2.4 8H8.9l-2.4-8Z" fill="currentColor" fillOpacity="0.12" />
        <path d="M6.5 17.5h19l-2.4 8H8.9l-2.4-8Z" />
        <path d="M9.5 25.5h13" />
      </svg>
    )
  }

  if (name === 'water') {
    return (
      <svg {...commonProps}>
        <path d="M9 5.5h14l-2 21H11L9 5.5Z" />
        <path d="M10.1 16c2.1-1.2 3.9 1.2 6 .1 2.1-1.1 3.7.8 5.8-.2l-1 10.6H11L10.1 16Z" fill="currentColor" fillOpacity="0.2" stroke="none" />
        <path d="M10.1 16c2.1-1.2 3.9 1.2 6 .1 2.1-1.1 3.7.8 5.8-.2" />
      </svg>
    )
  }

  if (name === 'activity') {
    return (
      <svg {...commonProps}>
        <path d="M9.5 14.5c-2.5-.2-4.3-1.8-4.8-4.1" />
        <path d="M9.5 13h9.2c2.6 0 4.5 1.8 4.5 4.2v1.3H12.1c-2.2 0-3.6-1.4-3.6-3.1 0-1 .4-1.8 1-2.4Z" fill="currentColor" fillOpacity="0.12" />
        <path d="M9.5 13h9.2c2.6 0 4.5 1.8 4.5 4.2v1.3H12.1c-2.2 0-3.6-1.4-3.6-3.1 0-1 .4-1.8 1-2.4Z" />
        <circle cx="23.2" cy="11.2" r="3.2" fill="currentColor" fillOpacity="0.12" />
        <circle cx="23.2" cy="11.2" r="3.2" />
        <path d="m24.5 8.3 2.8-1.8-.5 3.8" />
        <path d="M13.1 18.6 9.5 24M18.2 18.6l3.9 4.5M15.2 18.6l2.8 2.2" />
        <path d="M6.5 20.5H3.2M7.7 23.4H5.4" />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <circle cx="13.5" cy="13.5" r="7.2" fill="currentColor" fillOpacity="0.1" />
      <circle cx="13.5" cy="13.5" r="7.2" />
      <path d="m18.8 18.8 7 7" />
      <path d="M10.6 13.5h5.8M13.5 10.6v5.8" strokeWidth="1.5" />
    </svg>
  )
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

  const healthRecords: HealthRecordCard[] = latestQuestionnaire
    ? [
      {
        label: '식욕',
        value: levelLabels[latestQuestionnaire.appetiteLevel],
        note: '문진에서 기록한 식욕 상태',
        icon: 'food',
      },
      {
        label: '수분 섭취',
        value: levelLabels[latestQuestionnaire.waterIntakeLevel],
        note: '문진에서 기록한 수분 섭취 상태',
        icon: 'water',
      },
      {
        label: '활동량',
        value: levelLabels[latestQuestionnaire.activityLevel],
        note: '문진에서 기록한 활동 상태',
        icon: 'activity',
      },
      {
        label: '관찰 증상',
        value: getObservationSummary(latestQuestionnaire),
        note: latestQuestionnaire.additionalSymptoms || '추가로 작성한 증상이 없습니다.',
        icon: 'observation',
      },
    ]
    : [
      {
        label: '식욕',
        value: '-',
        note: '문진 기록 없음',
        icon: 'food',
      },
      {
        label: '수분 섭취',
        value: '-',
        note: '문진 기록 없음',
        icon: 'water',
      },
      {
        label: '활동량',
        value: '-',
        note: '문진 기록 없음',
        icon: 'activity',
      },
      {
        label: '관찰 증상',
        value: '-',
        note: '문진 기록 없음',
        icon: 'observation',
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
                    <HealthRecordIcon name={record.icon} />
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
            styles.insightCard
          }
        >
          <span
            className={
              styles.insightIcon
            }
            aria-hidden="true"
          >
            ◎
          </span>

          <div className={styles.insightContent}>
            <p
              className={
                styles.insightLabel
              }
            >
              AI HEALTH INSIGHT
            </p>

            <h2>
              {insightTitle}
            </h2>

            <p>
              {insightCopy}
            </p>
          </div>

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
