import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PetSectionNav } from '../../pets/components/PetSectionNav'
import { usePets } from '../../pets/hooks/usePets'
import {
  getAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
  type HealthAlertResponse,
} from '../api/alertApi'
import common from '../../../styles/featurePage.module.css'
import styles from './HealthHistoryPage.module.css'

type Tab = 'alerts' | 'history'

const history = [
  {
    id: 'demo-result',
    date: '2026.08.05',
    title: '수분 섭취·활동량 변화',
    grade: '관찰',
    score: '23%',
    description:
      '급한 이상 신호는 낮지만 수분 섭취 관찰이 필요해요.',
  },
  {
    id: 'result-0801',
    date: '2026.08.01',
    title: '정기 건강 문진',
    grade: '정상',
    score: '8%',
    description:
      '최근 건강 기록에서 뚜렷한 주의 신호가 발견되지 않았어요.',
  },
  {
    id: 'result-0728',
    date: '2026.07.28',
    title: '피부 가려움 문진',
    grade: '관찰',
    score: '31%',
    description:
      '피부 긁기 빈도와 붉은 부위를 3일간 기록하도록 안내했어요.',
  },
]

function formatAlertType(type: string) {
  switch (type) {
    case 'PREDICTION':
      return 'AI 예측'

    case 'VITAL':
      return '생체정보'

    default:
      return '건강 알림'
  }
}

function formatAlertTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getTone(
  severity: HealthAlertResponse['severity'],
) {
  switch (severity) {
    case 'DANGER':
      return 'warning'

    case 'CAUTION':
      return 'warning'

    case 'WATCH':
      return 'notice'

    default:
      return 'normal'
  }
}

export function HealthHistoryPage() {
  const { selectedPet } = usePets()

  const [tab, setTab] =
    useState<Tab>('alerts')

  const [alerts, setAlerts] =
    useState<HealthAlertResponse[]>([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const [isMarkingAll, setIsMarkingAll] =
    useState(false)

  useEffect(() => {
    if (!selectedPet?.id) {
      return
    }

    const loadAlerts = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const result = await getAlerts(
          selectedPet.id,
        )

        setAlerts(result)
      } catch (loadError) {
        console.error(
          '알림 조회 실패:',
          loadError,
        )

        setError(
          '건강 알림을 불러오지 못했습니다.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    void loadAlerts()
  }, [selectedPet?.id])

  const unreadCount = alerts.filter(
    (alertItem) => !alertItem.isRead,
  ).length

  const handleAlertClick = async (
    alertItem: HealthAlertResponse,
  ) => {
    if (alertItem.isRead) {
      return
    }

    try {
      const updated =
        await markAlertAsRead(
          alertItem.alertId,
        )

      setAlerts((current) =>
        current.map((item) =>
          item.alertId === updated.alertId
            ? updated
            : item,
        ),
      )
    } catch (readError) {
      console.error(
        '알림 읽음 처리 실패:',
        readError,
      )

      alert(
        '알림 읽음 처리에 실패했습니다.',
      )
    }
  }

  const handleMarkAllAsRead =
    async () => {
      if (
        !selectedPet?.id ||
        unreadCount === 0
      ) {
        return
      }

      try {
        setIsMarkingAll(true)

        await markAllAlertsAsRead(
          selectedPet.id,
        )

        setAlerts((current) =>
          current.map((item) => ({
            ...item,
            isRead: true,
          })),
        )
      } catch (readError) {
        console.error(
          '전체 읽음 처리 실패:',
          readError,
        )

        alert(
          '전체 읽음 처리에 실패했습니다.',
        )
      } finally {
        setIsMarkingAll(false)
      }
    }

  return (
    <div className={common.page}>
      <PetSectionNav />

      <header className={common.header}>
        <div>
          <p className={common.eyebrow}>
            HEALTH TIMELINE
          </p>

          <h1 className={common.title}>
            알림과 건강 이력
          </h1>

          <p
            className={
              common.description
            }
          >
            {selectedPet.name}에게 도착한
            건강 신호와 문진 결과를
            시간순으로 모았어요.
          </p>
        </div>

        <button
          className={
            common.secondaryButton
          }
          type="button"
          disabled={
            unreadCount === 0 ||
            isMarkingAll
          }
          onClick={
            handleMarkAllAsRead
          }
        >
          {isMarkingAll
            ? '처리 중...'
            : '모두 읽음 처리'}
        </button>
      </header>

      <div
        className={styles.tabs}
        role="tablist"
        aria-label="건강 기록 종류"
      >
        <button
          className={
            tab === 'alerts'
              ? styles.active
              : ''
          }
          onClick={() =>
            setTab('alerts')
          }
          role="tab"
          aria-selected={
            tab === 'alerts'
          }
          type="button"
        >
          알림

          <span>
            {unreadCount}
          </span>
        </button>

        <button
          className={
            tab === 'history'
              ? styles.active
              : ''
          }
          onClick={() =>
            setTab('history')
          }
          role="tab"
          aria-selected={
            tab === 'history'
          }
          type="button"
        >
          과거 예측 이력
        </button>
      </div>

      {tab === 'alerts' ? (
        <section
          className={styles.timeline}
          aria-label="최근 알림"
        >
          {isLoading && (
            <p>
              알림을 불러오는 중입니다.
            </p>
          )}

          {!isLoading &&
            error && (
              <p>{error}</p>
            )}

          {!isLoading &&
            !error &&
            alerts.length === 0 && (
              <p>
                아직 도착한 건강 알림이
                없습니다.
              </p>
            )}

          {!isLoading &&
            !error &&
            alerts.map(
              (alertItem) => {
                const tone =
                  getTone(
                    alertItem.severity,
                  )

                return (
                  <article
                    className={`${styles.alertCard} ${styles[tone]}`}
                    key={
                      alertItem.alertId
                    }
                    style={{
                      opacity:
                        alertItem.isRead
                          ? 0.7
                          : 1,
                    }}
                  >
                    <div
                      className={
                        styles.alertMarker
                      }
                    >
                      <span>
                        {alertItem.severity ===
                          'DANGER' ||
                          alertItem.severity ===
                          'CAUTION'
                          ? '!'
                          : '•'}
                      </span>
                    </div>

                    <div
                      className={
                        styles.alertBody
                      }
                    >
                      <div
                        className={
                          styles.alertMeta
                        }
                      >
                        <span>
                          {formatAlertType(
                            alertItem.alertType,
                          )}
                        </span>

                        <time>
                          {formatAlertTime(
                            alertItem.createdAt,
                          )}
                        </time>

                        {alertItem.isRead && (
                          <span>
                            읽음
                          </span>
                        )}
                      </div>

                      <h2>
                        {
                          alertItem.title
                        }
                      </h2>

                      <p>
                        {
                          alertItem.message
                        }
                      </p>

                      {alertItem.predictionId && (
                        <Link
                          to={`/predictions/${alertItem.predictionId}`}
                        >
                          예측 결과 보기 →
                        </Link>
                      )}
                    </div>

                    {!alertItem.isRead && (
                      <button
                        type="button"
                        aria-label={`${alertItem.title} 읽음 처리`}
                        onClick={() =>
                          void handleAlertClick(
                            alertItem,
                          )
                        }
                      >
                        읽음
                      </button>
                    )}
                  </article>
                )
              },
            )}
        </section>
      ) : (
        <section
          className={
            styles.historyList
          }
          aria-label="과거 예측 이력"
        >
          {history.map((item) => (
            <article
              className={
                styles.historyCard
              }
              key={item.id}
            >
              <time>
                {item.date}
              </time>

              <div>
                <span
                  className={
                    item.grade ===
                      '정상'
                      ? styles.normalGrade
                      : styles.watchGrade
                  }
                >
                  {item.grade}
                </span>

                <h2>
                  {item.title}
                </h2>

                <p>
                  {
                    item.description
                  }
                </p>
              </div>

              <div
                className={
                  styles.historyScore
                }
              >
                <strong>
                  {item.score}
                </strong>

                <Link
                  to={`/predictions/${item.id}`}
                >
                  결과 보기 →
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}