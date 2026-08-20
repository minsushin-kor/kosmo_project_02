import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAlerts, type HealthAlertResponse } from '../../history/api/alertApi'
import { PetSelector } from '../../pets/components/PetSelector'
import { usePets } from '../../pets/hooks/usePets'
import {
  getLatestVital,
  type VitalRecordResponse,
  type VitalStatus,
} from '../../vitals/api/vitalApi'
import styles from './DashboardPage.module.css'

const weeklyData = [48, 56, 53, 68, 72, 64, 78]

function getStatusLabel(status: VitalStatus) {
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

function getStatusMessage(status: VitalStatus) {
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
  const { selectedPet } = usePets()
  const petBase = `/pets/${selectedPet.id}`

  const [latestVital, setLatestVital] =
    useState<VitalRecordResponse | null>(null)

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [alerts, setAlerts] =
    useState<HealthAlertResponse[]>([])

  const [alertsLoading, setAlertsLoading] =
    useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadLatestVital() {
      setLoading(true)
      setErrorMessage('')

      try {
        const response =
          await getLatestVital(selectedPet.id)

        if (cancelled) {
          return
        }

        setLatestVital(response)
      } catch (error) {
        console.error(
          '최근 생체정보를 불러오지 못했습니다.',
          error,
        )

        if (!cancelled) {
          setLatestVital(null)
          setErrorMessage(
            '최근 생체정보를 불러오지 못했습니다.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadLatestVital()

    return () => {
      cancelled = true
    }
  }, [selectedPet.id])

  useEffect(() => {
    let cancelled = false

    async function loadAlerts() {
      setAlertsLoading(true)

      try {
        const response =
          await getAlerts(selectedPet.id)

        if (!cancelled) {
          setAlerts(response)
        }
      } catch (error) {
        console.error(
          '알림을 불러오지 못했습니다.',
          error,
        )

        if (!cancelled) {
          setAlerts([])
        }
      } finally {
        if (!cancelled) {
          setAlertsLoading(false)
        }
      }
    }

    void loadAlerts()

    return () => {
      cancelled = true
    }
  }, [selectedPet.id])

  const vitals = useMemo(
    () => [
      {
        label: '체온',
        value:
          latestVital?.temperature.toFixed(1) ??
          '-',
        unit: '°C',
        note: latestVital
          ? '최근 측정 기준'
          : '측정 기록이 없어요',
        icon: '♨',
      },
      {
        label: '심박수',
        value:
          latestVital?.heartRate.toString() ??
          '-',
        unit: 'bpm',
        note: latestVital
          ? '최근 측정 기준'
          : '측정 기록이 없어요',
        icon: '♥',
      },
      {
        label: '호흡수',
        value:
          latestVital?.respiratoryRate.toString() ??
          '-',
        unit: '회/분',
        note: latestVital
          ? '최근 측정 기준'
          : '측정 기록이 없어요',
        icon: '⌁',
      },
    ],
    [latestVital],
  )

  const unreadAlerts = useMemo(
    () => alerts.filter((alert) => !alert.isRead),
    [alerts],
  )

  const latestAlert = alerts[0] ?? null

  const statusLabel = latestVital
    ? getStatusLabel(latestVital.status)
    : '기록 없음'

  const statusMessage = latestVital
    ? getStatusMessage(latestVital.status)
    : '최근 생체정보를 확인해 주세요'

  return (
    <div className={styles.page}>
      <section className={styles.welcome}>
        <div>
          <p className={styles.eyebrow}>
            TODAY&apos;S PET WELLNESS
          </p>

          <h1>안녕하세요, 보호자님.</h1>

          <p>
            {selectedPet.name}의 오늘 건강 신호를
            차분하게 살펴볼까요?
          </p>
        </div>

        <PetSelector />
      </section>

      <section
        className={styles.summaryGrid}
        aria-label="건강 상태 요약"
      >
        <article className={styles.overallCard}>
          <div className={styles.cardHeading}>
            <div>
              <p>오늘의 건강 신호</p>

              <h2>{statusMessage}</h2>
            </div>

            <span className={styles.normalBadge}>
              {statusLabel}
            </span>
          </div>

          <div className={styles.scoreArea}>
            <div
              className={styles.scoreRing}
              aria-label="건강 상태"
            >
              <strong>
                {latestVital
                  ? getStatusLabel(
                    latestVital.status,
                  )
                  : '-'}
              </strong>
            </div>

            <p>
              {loading
                ? '최근 생체정보를 확인하고 있어요.'
                : errorMessage
                  ? errorMessage
                  : latestVital
                    ? '가장 최근에 측정된 생체정보를 기준으로 현재 상태를 보여드리고 있어요.'
                    : '아직 등록된 생체정보가 없어요. 생체정보를 먼저 기록해 주세요.'}
            </p>
          </div>

          <Link
            className={styles.darkButton}
            to={`${petBase}/questionnaire`}
          >
            오늘 건강 문진 시작하기
          </Link>
        </article>

        <article className={styles.noticeCard}>
          <span
            className={styles.noticeIcon}
            aria-hidden="true"
          >
            ✦
          </span>

          <div>
            <p>건강 알림</p>

            <h2>
              {alertsLoading
                ? '알림 확인 중...'
                : unreadAlerts.length > 0
                  ? `확인하지 않은 알림 ${unreadAlerts.length}건`
                  : '새로운 알림이 없어요'}
            </h2>

            <small>
              {alertsLoading
                ? `${selectedPet.name}의 최근 알림을 확인하고 있어요.`
                : latestAlert
                  ? latestAlert.message
                  : '현재 확인이 필요한 건강 알림이 없습니다.'}
            </small>
          </div>

          <Link to={`${petBase}/history`}>
            {unreadAlerts.length > 0
              ? '알림 확인'
              : '알림 기록 보기'}
          </Link>
        </article>
      </section>

      <section className={styles.vitalsSection}>
        <div className={styles.sectionTitle}>
          <div>
            <p>LIVE HEALTH SIGNALS</p>
            <h2>최근 생체정보</h2>
          </div>

          <Link to={`${petBase}/vitals`}>
            전체 기록 보기{' '}
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className={styles.vitalGrid}>
          {vitals.map((vital) => (
            <article
              className={styles.vitalCard}
              key={vital.label}
            >
              <div className={styles.vitalTop}>
                <span aria-hidden="true">
                  {vital.icon}
                </span>

                <p>{vital.label}</p>

                <small>
                  {latestVital
                    ? statusLabel
                    : '-'}
                </small>
              </div>

              <div className={styles.vitalValue}>
                <strong>{vital.value}</strong>
                <span>{vital.unit}</span>
              </div>

              <p className={styles.vitalNote}>
                {vital.note}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.detailGrid}>
        <article className={styles.chartCard}>
          <div className={styles.cardHeading}>
            <div>
              <p>WEEKLY TREND</p>
              <h2>이번 주 활동 흐름</h2>
            </div>

            <button type="button">
              최근 7일 ⌄
            </button>
          </div>

          <div
            className={styles.chart}
            aria-label="최근 7일 활동량 막대그래프"
          >
            {weeklyData.map(
              (value, index) => (
                <div
                  className={styles.chartColumn}
                  key={`${value}-${index}`}
                >
                  <div
                    className={
                      styles.chartTrack
                    }
                  >
                    <span
                      style={{
                        height: `${value}%`,
                      }}
                    />
                  </div>

                  <small>
                    {
                      [
                        '월',
                        '화',
                        '수',
                        '목',
                        '금',
                        '토',
                        '일',
                      ][index]
                    }
                  </small>
                </div>
              ),
            )}
          </div>
        </article>

        <article className={styles.insightCard}>
          <p className={styles.insightLabel}>
            AI HEALTH INSIGHT
          </p>

          <span
            className={styles.insightIcon}
            aria-hidden="true"
          >
            ◎
          </span>

          <h2>
            이번 주는 활동량이
            <br />
            조금씩 좋아지고 있어요.
          </h2>

          <p>
            평소보다 수분 섭취량이 조금
            적었어요. 산책 후 물을 충분히
            마시는지 살펴봐 주세요.
          </p>

          <Link to={`${petBase}/reports`}>
            주간 리포트 확인하기{' '}
            <span aria-hidden="true">→</span>
          </Link>
        </article>
      </section>
    </div>
  )
}