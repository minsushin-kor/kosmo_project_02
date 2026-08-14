import { useEffect, useMemo, useState } from 'react'
import { PetSectionNav } from '../../pets/components/PetSectionNav'
import { usePets } from '../../pets/hooks/usePets'
import {
  getLatestVital,
  getVitals,
  type VitalRecordResponse,
  type VitalStatus,
} from '../api/vitalApi'
import shared from '../../../styles/featurePage.module.css'
import styles from './VitalMonitoringPage.module.css'

function getPeriodStart(period: string) {
  const now = new Date()

  if (period === '24시간') {
    return new Date(
      now.getTime() - 24 * 60 * 60 * 1000,
    )
  }

  if (period === '30일') {
    return new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000,
    )
  }

  return new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000,
  )
}

function createPolylinePoints(
  values: number[],
  width = 800,
  height = 220,
  padding = 20,
) {
  if (values.length === 0) {
    return ''
  }

  if (values.length === 1) {
    const y = height / 2

    return `0,${y} ${width},${y}`
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  return values
    .map((value, index) => {
      const x =
        (index / (values.length - 1)) * width

      const normalized =
        (value - min) / range

      const y =
        height -
        padding -
        normalized *
        (height - padding * 2)

      return `${x},${y}`
    })
    .join(' ')
}

function formatChartLabel(value: string) {
  const date = new Date(value)

  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
  })
}

function formatMeasuredAt(value: string) {
  return new Date(value).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatLatestTime(value: string) {
  return new Date(value).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

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

function isNormal(status: VitalStatus) {
  return status === 'NORMAL'
}

export function VitalMonitoringPage() {
  const { selectedPet } = usePets()

  const [period, setPeriod] = useState('7일')

  const [latestVital, setLatestVital] =
    useState<VitalRecordResponse | null>(null)

  const [vitals, setVitals] =
    useState<VitalRecordResponse[]>([])

  const [loading, setLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
    useState('')

  useEffect(() => {
    let cancelled = false

    async function loadVitals() {
      setLoading(true)
      setErrorMessage('')

      try {
        const [
          latestResponse,
          historyResponse,
        ] = await Promise.all([
          getLatestVital(selectedPet.id),
          getVitals(selectedPet.id),
        ])

        if (cancelled) {
          return
        }

        setLatestVital(latestResponse)
        setVitals(historyResponse)
      } catch (error) {
        console.error(
          '생체정보를 불러오지 못했습니다.',
          error,
        )

        if (!cancelled) {
          setErrorMessage(
            '생체정보를 불러오지 못했습니다.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadVitals()

    return () => {
      cancelled = true
    }
  }, [selectedPet.id])

  const sortedVitals = useMemo(
    () =>
      [...vitals].sort(
        (a, b) =>
          new Date(
            b.measuredAt,
          ).getTime() -
          new Date(
            a.measuredAt,
          ).getTime(),
      ),
    [vitals],
  )

  const filteredVitals = useMemo(() => {
    const start = getPeriodStart(period)

    return [...vitals]
      .filter(
        (vital) =>
          new Date(
            vital.measuredAt,
          ).getTime() >= start.getTime(),
      )
      .sort(
        (a, b) =>
          new Date(
            a.measuredAt,
          ).getTime() -
          new Date(
            b.measuredAt,
          ).getTime(),
      )
  }, [vitals, period])

  const temperaturePoints = useMemo(
    () =>
      createPolylinePoints(
        filteredVitals.map(
          (vital) =>
            vital.temperature,
        ),
      ),
    [filteredVitals],
  )

  const heartRatePoints = useMemo(
    () =>
      createPolylinePoints(
        filteredVitals.map(
          (vital) =>
            vital.heartRate,
        ),
      ),
    [filteredVitals],
  )

  const respiratoryRatePoints = useMemo(
    () =>
      createPolylinePoints(
        filteredVitals.map(
          (vital) =>
            vital.respiratoryRate,
        ),
      ),
    [filteredVitals],
  )

  const chartLabels = useMemo(() => {
    if (filteredVitals.length === 0) {
      return []
    }

    if (filteredVitals.length <= 8) {
      return filteredVitals.map(
        (vital) =>
          formatChartLabel(
            vital.measuredAt,
          ),
      )
    }

    const step = Math.ceil(
      filteredVitals.length / 8,
    )

    return filteredVitals
      .filter(
        (_, index) =>
          index % step === 0 ||
          index ===
          filteredVitals.length - 1,
      )
      .map((vital) =>
        formatChartLabel(
          vital.measuredAt,
        ),
      )
  }, [filteredVitals])

  return (
    <>
      <PetSectionNav />

      <div className={shared.page}>
        <header className={shared.header}>
          <div>
            <p className={shared.eyebrow}>
              VITAL MONITORING
            </p>

            <h1 className={shared.title}>
              생체정보 모니터링
            </h1>

            <p className={shared.description}>
              {selectedPet.name}의
              체온·심박수·호흡수 변화를
              시간순으로 확인합니다.
            </p>
          </div>

          <span className={shared.mockBadge}>
            {latestVital
              ? `최근 측정 ${formatLatestTime(
                latestVital.measuredAt,
              )}`
              : '최근 측정 없음'}
          </span>
        </header>

        {errorMessage && (
          <section className={shared.panel}>
            <p>{errorMessage}</p>
          </section>
        )}

        <section
          className={shared.gridThree}
          aria-label="최신 생체정보"
        >
          <article className={styles.vitalCard}>
            <div>
              <span aria-hidden="true">
                ♨
              </span>
              <p>체온</p>

              <small>
                {latestVital
                  ? getStatusLabel(
                    latestVital.status,
                  )
                  : '-'}
              </small>
            </div>

            <strong>
              {loading || !latestVital
                ? '-'
                : latestVital.temperature.toFixed(
                  1,
                )}
              <em>°C</em>
            </strong>

            <p>최신 측정값</p>
          </article>

          <article className={styles.vitalCard}>
            <div>
              <span aria-hidden="true">
                ♥
              </span>
              <p>심박수</p>

              <small>
                {latestVital
                  ? getStatusLabel(
                    latestVital.status,
                  )
                  : '-'}
              </small>
            </div>

            <strong>
              {loading || !latestVital
                ? '-'
                : latestVital.heartRate}
              <em>bpm</em>
            </strong>

            <p>최신 측정값</p>
          </article>

          <article className={styles.vitalCard}>
            <div>
              <span aria-hidden="true">
                ⌁
              </span>
              <p>호흡수</p>

              <small>
                {latestVital
                  ? getStatusLabel(
                    latestVital.status,
                  )
                  : '-'}
              </small>
            </div>

            <strong>
              {loading || !latestVital
                ? '-'
                : latestVital.respiratoryRate}
              <em>회/분</em>
            </strong>

            <p>최신 측정값</p>
          </article>
        </section>

        <section
          className={`${shared.panel} ${styles.chartPanel}`}
        >
          <div className={styles.panelHeader}>
            <div>
              <p>VITAL TREND</p>
              <h2>최근 측정 흐름</h2>
            </div>

            <div
              className={
                styles.periodButtons
              }
              aria-label="조회 기간"
            >
              {[
                '24시간',
                '7일',
                '30일',
              ].map((item) => (
                <button
                  type="button"
                  className={
                    period === item
                      ? styles.active
                      : ''
                  }
                  onClick={() =>
                    setPeriod(item)
                  }
                  key={item}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.legend}>
            <span>
              <i
                className={
                  styles.temperature
                }
              />
              체온
            </span>

            <span>
              <i
                className={styles.heart}
              />
              심박수
            </span>

            <span>
              <i
                className={styles.breath}
              />
              호흡수
            </span>
          </div>

          <div
            className={styles.chart}
            role="img"
            aria-label={`${period} 동안의 생체정보 변화 그래프`}
          >
            <div
              className={styles.gridLines}
            >
              {[0, 1, 2, 3].map(
                (line) => (
                  <span key={line} />
                ),
              )}
            </div>

            {filteredVitals.length > 0 ? (
              <>
                <svg
                  viewBox="0 0 800 220"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <polyline
                    className={
                      styles.temperatureLine
                    }
                    points={
                      temperaturePoints
                    }
                  />

                  <polyline
                    className={
                      styles.heartLine
                    }
                    points={
                      heartRatePoints
                    }
                  />

                  <polyline
                    className={
                      styles.breathLine
                    }
                    points={
                      respiratoryRatePoints
                    }
                  />
                </svg>

                <div
                  className={styles.xAxis}
                >
                  {chartLabels.map(
                    (label, index) => (
                      <span
                        key={`${label}-${index}`}
                      >
                        {label}
                      </span>
                    ),
                  )}
                </div>
              </>
            ) : (
              <p>
                해당 기간의 생체정보가
                없습니다.
              </p>
            )}
          </div>
        </section>

        <section
          className={`${shared.panel} ${styles.historyPanel}`}
        >
          <div className={styles.panelHeader}>
            <div>
              <p>RECENT RECORDS</p>
              <h2>최근 측정 기록</h2>
            </div>

            <button type="button">
              CSV 내보내기
            </button>
          </div>

          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>측정 시각</th>
                  <th>체온</th>
                  <th>심박수</th>
                  <th>호흡수</th>
                  <th>상태</th>
                </tr>
              </thead>

              <tbody>
                {sortedVitals.length ===
                  0 ? (
                  <tr>
                    <td colSpan={5}>
                      저장된 생체정보가
                      없습니다.
                    </td>
                  </tr>
                ) : (
                  sortedVitals.map(
                    (row) => (
                      <tr
                        key={
                          row.vitalRecordId
                        }
                      >
                        <td>
                          {formatMeasuredAt(
                            row.measuredAt,
                          )}
                        </td>

                        <td>
                          {row.temperature.toFixed(
                            1,
                          )}
                          °C
                        </td>

                        <td>
                          {row.heartRate} bpm
                        </td>

                        <td>
                          {
                            row.respiratoryRate
                          }
                          회/분
                        </td>

                        <td>
                          <span
                            className={
                              isNormal(
                                row.status,
                              )
                                ? styles.normal
                                : styles.watch
                            }
                          >
                            {getStatusLabel(
                              row.status,
                            )}
                          </span>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  )
}