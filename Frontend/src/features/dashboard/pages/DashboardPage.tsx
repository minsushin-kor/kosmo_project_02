import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router-dom'

import { DataState } from '../../../components/common/DataState'
import {
  getHealthAlerts,
  type HealthAlert,
} from '../../history/api/healthHistoryApi'
import { PetSelector } from '../../pets/components/PetSelector'
import { usePets } from '../../pets/hooks/usePets'
import {
  getPredictionByQuestionnaire,
  type HealthPrediction,
} from '../../predictions/api/predictionApi'
import { getQuestionnaires } from '../../questionnaire/api/questionnaireApi'
import {
  getWeeklyReports,
  type WeeklyReport,
} from '../../reports/api/reportApi'
import {
  getLatestVital,
  type VitalRecord,
  type VitalStatus,
} from '../../vitals/api/vitalApi'
import styles from './DashboardPage.module.css'

const demoVitals = [
  {
    label: '체온',
    value: '38.4',
    unit: '°C',
    note: '평소 범위예요',
    icon: '♨',
  },
  {
    label: '심박수',
    value: '92',
    unit: 'bpm',
    note: '안정적으로 보여요',
    icon: '♥',
  },
  {
    label: '호흡수',
    value: '24',
    unit: '회/분',
    note: '최근 측정 기준',
    icon: '⌁',
  },
]

const weeklyData = [
  48,
  56,
  53,
  68,
  72,
  64,
  78,
]

const weekLabels = [
  '월',
  '화',
  '수',
  '목',
  '금',
  '토',
  '일',
]

function getStatusLabel(
  status: VitalStatus,
) {
  switch (status) {
    case 'NORMAL':
      return '정상'

    case 'WATCH':
      return '관찰'

    case 'CAUTION':
      return '주의'

    case 'DANGER':
      return '위험'
  }
}

function getStatusMessage(
  status: VitalStatus,
) {
  switch (status) {
    case 'NORMAL':
      return '전반적으로 안정적이에요'

    case 'WATCH':
      return '조금 더 관찰이 필요해요'

    case 'CAUTION':
      return '건강 상태에 주의가 필요해요'

    case 'DANGER':
      return '빠른 상태 확인이 필요해요'
  }
}

export function DashboardPage() {
  const {
    selectedPet,
    isLoading,
    isDemoMode,
  } = usePets()

  const [
    latestVital,
    setLatestVital,
  ] = useState<VitalRecord | null>(
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

  useEffect(() => {
    if (
      !selectedPet ||
      isDemoMode
    ) {
      setLatestVital(null)
      setAlerts([])
      setLatestPrediction(null)
      setLatestReport(null)
      return
    }

    const controller =
      new AbortController()
    const petId = selectedPet.id

    async function loadDashboard() {
      const [
        vital,
        healthAlerts,
        questionnaires,
        reports,
      ] = await Promise.all([
        getLatestVital(
          petId,
          controller.signal,
        ).catch(() => null),

        getHealthAlerts(
          petId,
          controller.signal,
        ).catch(() => []),

        getQuestionnaires(
          petId,
          controller.signal,
        ).catch(() => []),

        getWeeklyReports(
          petId,
          controller.signal,
        ).catch(() => []),
      ])

      if (
        controller.signal.aborted
      ) {
        return
      }

      setLatestVital(vital)
      setAlerts(healthAlerts)
      setLatestReport(
        reports[0] ?? null,
      )

      if (
        questionnaires.length === 0
      ) {
        setLatestPrediction(null)
        return
      }

      const prediction =
        await getPredictionByQuestionnaire(
          questionnaires[0]
            .questionnaireId,
          controller.signal,
        ).catch(() => null)

      if (
        !controller.signal.aborted
      ) {
        setLatestPrediction(
          prediction,
        )
      }
    }

    void loadDashboard()

    return () => {
      controller.abort()
    }
  }, [
    isDemoMode,
    selectedPet,
  ])

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

  const vitals = latestVital
    ? [
      {
        label: '체온',
        value:
          latestVital.temperature.toFixed(
            1,
          ),
        unit: '°C',
        note: '최근 측정값',
        icon: '♨',
      },
      {
        label: '심박수',
        value: String(
          latestVital.heartRate,
        ),
        unit: 'bpm',
        note: '최근 측정값',
        icon: '♥',
      },
      {
        label: '호흡수',
        value: String(
          latestVital.respiratoryRate,
        ),
        unit: '회/분',
        note: '최근 측정값',
        icon: '⌁',
      },
    ]
    : isDemoMode
      ? demoVitals
      : [
        {
          label: '체온',
          value: '-',
          unit: '°C',
          note: '측정 기록 없음',
          icon: '♨',
        },
        {
          label: '심박수',
          value: '-',
          unit: 'bpm',
          note: '측정 기록 없음',
          icon: '♥',
        },
        {
          label: '호흡수',
          value: '-',
          unit: '회/분',
          note: '측정 기록 없음',
          icon: '⌁',
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
      : Math.max(
        0,
        100 - riskPercent,
      )

  const statusLabel =
    latestVital
      ? getStatusLabel(
        latestVital.status,
      )
      : '기록 없음'

  const statusMessage =
    latestVital
      ? getStatusMessage(
        latestVital.status,
      )
      : '최근 생체정보를 확인해 주세요'

  const overallTitle =
    latestPrediction
      ? latestPrediction.riskGrade ===
        'NORMAL'
        ? '최근 기록은 정상 범위예요'
        : '최근 건강 신호를 관찰해 주세요'
      : statusMessage

  const overallDescription =
    latestPrediction?.aiSummary ??
    (latestVital
      ? '가장 최근에 측정된 생체정보를 기준으로 현재 상태를 보여드리고 있어요.'
      : '오늘의 건강 문진을 완료하면 AI 위험도 분석 결과가 표시됩니다.')

  const insightTitle =
    latestReport?.oneLineSummary ??
    (latestPrediction
      ? '최근 AI 예측 결과를 확인해 보세요.'
      : '건강 문진을 시작해 보세요.')

  const insightCopy =
    latestReport?.reportContent ??
    latestPrediction?.aiSummary ??
    '문진과 생체정보가 쌓이면 AI 건강 인사이트가 표시됩니다.'

  /*
   * 아직 실제 활동량 API는 없으므로
   * 데모 모드에서만 샘플 그래프를 표시합니다.
   */
  const chartData =
    isDemoMode
      ? weeklyData
      : [0, 0, 0, 0, 0, 0, 0]

  return (
    <div className={styles.page}>
      <section
        className={
          styles.welcome
        }
      >
        <div>
          <p
            className={
              styles.eyebrow
            }
          >
            TODAY&apos;S PET
            WELLNESS
          </p>

          <h1>
            안녕하세요, 보호자님.
          </h1>

          <p>
            {selectedPet.name}의
            오늘 건강 신호를
            차분하게 살펴볼까요?
          </p>
        </div>

        <PetSelector />
      </section>

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
                : statusLabel}
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
              LIVE HEALTH SIGNALS
            </p>

            <h2>
              최근 생체정보
            </h2>
          </div>

          <Link
            to={`${petBase}/vitals`}
          >
            전체 기록 보기{' '}
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
          {vitals.map(
            (vital) => (
              <article
                className={
                  styles.vitalCard
                }
                key={
                  vital.label
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
                    {vital.icon}
                  </span>

                  <p>
                    {vital.label}
                  </p>

                  <small>
                    {latestVital
                      ? statusLabel
                      : isDemoMode
                        ? '데모'
                        : '기록 전'}
                  </small>
                </div>

                <div
                  className={
                    styles.vitalValue
                  }
                >
                  <strong>
                    {vital.value}
                  </strong>

                  <span>
                    {vital.unit}
                  </span>
                </div>

                <p
                  className={
                    styles.vitalNote
                  }
                >
                  {vital.note}
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
              disabled={!isDemoMode}
            >
              {isDemoMode
                ? '최근 7일 ⌄'
                : '활동 API 준비 필요'}
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
