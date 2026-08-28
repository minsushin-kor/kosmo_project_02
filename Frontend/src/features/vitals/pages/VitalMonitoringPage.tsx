import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DataState } from '../../../components/common/DataState'
import { getApiErrorMessage, isAbortError } from '../../../shared/api/apiClient'
import { useRoutePet } from '../../pets/hooks/useRoutePet'
import {
  getPredictions,
  type HealthPrediction,
  type RiskGrade,
} from '../../predictions/api/predictionApi'
import {
  getQuestionnaires,
  type QuestionnaireResponse,
} from '../../questionnaire/api/questionnaireApi'
import {
  buildQuestionnaireTrendPoints,
  buildQuestionnaireTrendTicks,
  buildQuestionnaireValueTicks,
  filterQuestionnairesByScale,
  formatQuestionnaireTrendTick,
  getQuestionnaireTrendRange,
  TREND_VIEW_OPTIONS,
  type TrendScale,
} from '../utils/questionnaireTrend'
import shared from '../../../styles/featurePage.module.css'
import styles from './VitalMonitoringPage.module.css'

type MetricKey = 'temperature' | 'heartRate' | 'respiratoryRate'

const metricConfig: Record<MetricKey, {
  label: string
  unit: string
  icon: string
  decimals: number
  color: string
}> = {
  temperature: {
    label: '체온',
    unit: '°C',
    icon: '♨',
    decimals: 1,
    color: '#7f8a66',
  },
  heartRate: {
    label: '심박수',
    unit: 'bpm',
    icon: '♥',
    decimals: 0,
    color: '#c18468',
  },
  respiratoryRate: {
    label: '호흡수',
    unit: '회/분',
    icon: '⌁',
    decimals: 0,
    color: '#7695a0',
  },
}

const riskLabels: Record<RiskGrade, string> = {
  NORMAL: '정상',
  WATCH: '관찰',
  CAUTION: '주의',
  DANGER: '위험',
}

const scaleLabels: Record<TrendScale, string> = {
  DAY: '일 단위',
  WEEK: '주 단위',
  MONTH: '월 단위',
}

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatMetricValue(value: number, metric: MetricKey) {
  return value.toFixed(metricConfig[metric].decimals)
}

function getRiskTone(grade?: RiskGrade) {
  if (grade === 'NORMAL') return styles.normal
  if (grade === 'DANGER') return styles.danger
  return styles.watch
}

export function VitalMonitoringPage() {
  const navigate = useNavigate()
  const { selectedPet, routePetMissing } = useRoutePet()
  const [scale, setScale] = useState<TrendScale>('DAY')
  const [metric, setMetric] = useState<MetricKey>('temperature')
  const [records, setRecords] = useState<QuestionnaireResponse[]>([])
  const [predictions, setPredictions] = useState<HealthPrediction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [predictionNotice, setPredictionNotice] = useState('')

  useEffect(() => {
    if (!selectedPet) {
      setRecords([])
      setPredictions([])
      return
    }

    const controller = new AbortController()
    let isActive = true

    setIsLoading(true)
    setError('')
    setPredictionNotice('')

    Promise.allSettled([
      getQuestionnaires(selectedPet.id, controller.signal),
      getPredictions(selectedPet.id, controller.signal),
    ])
      .then(([questionnaireResult, predictionResult]) => {
        if (!isActive) return

        if (questionnaireResult.status === 'rejected') {
          if (!isAbortError(questionnaireResult.reason)) {
            setError(getApiErrorMessage(questionnaireResult.reason, '건강 문진 기록을 불러오지 못했습니다.'))
          }
          setRecords([])
        } else {
          setRecords([...questionnaireResult.value].sort(
            (left, right) => Date.parse(right.submittedAt) - Date.parse(left.submittedAt),
          ))
        }

        if (predictionResult.status === 'rejected') {
          setPredictions([])
          if (!isAbortError(predictionResult.reason)) {
            setPredictionNotice('AI 분석 결과는 불러오지 못했지만 입력한 건강 수치는 확인할 수 있습니다.')
          }
        } else {
          setPredictions(predictionResult.value)
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
      controller.abort()
    }
  }, [selectedPet])

  const [rangeEnd] = useState(() => Date.now())
  const range = useMemo(
    () => getQuestionnaireTrendRange(scale, rangeEnd, records),
    [rangeEnd, records, scale],
  )
  const visibleRecords = useMemo(
    () => filterQuestionnairesByScale(records, scale, rangeEnd),
    [rangeEnd, records, scale],
  )
  const predictionByQuestionnaireId = useMemo(
    () => new Map(predictions.map((prediction) => [prediction.questionnaireId, prediction])),
    [predictions],
  )
  const unanalyzedCount = useMemo(
    () => records.filter(
      (record) => !predictionByQuestionnaireId.has(record.questionnaireId),
    ).length,
    [predictionByQuestionnaireId, records],
  )
  const points = useMemo(
    () => buildQuestionnaireTrendPoints(visibleRecords, (record) => record[metric], range.start, range.end),
    [metric, range.end, range.start, visibleRecords],
  )
  const valueTicks = useMemo(
    () => buildQuestionnaireValueTicks(visibleRecords, (record) => record[metric]),
    [metric, visibleRecords],
  )
  const timeTicks = useMemo(
    () => buildQuestionnaireTrendTicks(scale, range.start, range.end),
    [range.end, range.start, scale],
  )

  if (!selectedPet || routePetMissing) {
    return (
      <div className={shared.page}>
        <DataState
          title="반려동물 정보를 찾을 수 없습니다."
          action={<Link to="/pets">반려동물 목록으로 이동</Link>}
        />
      </div>
    )
  }

  const latest = records[0]
  const previous = records[1]
  const latestPrediction = latest
    ? predictionByQuestionnaireId.get(latest.questionnaireId)
    : undefined
  const statusLabel = latestPrediction
    ? riskLabels[latestPrediction.riskGrade]
    : '분석 전'
  const selectedMetric = metricConfig[metric]

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <div>
          <p className={shared.eyebrow}>HEALTH VALUE TREND</p>
          <h1 className={shared.title}>건강 수치 변화</h1>
          <p className={shared.description}>
            {selectedPet.name}의 건강 문진에 입력한 체온·심박수·호흡수 변화를 확인합니다.
          </p>
        </div>
        <span className={shared.statusBadge}>
          {latest ? `최근 입력 ${formatSubmittedAt(latest.submittedAt)}` : '입력 기록 없음'}
        </span>
      </header>

      <aside className={styles.sourceNotice}>
        <span aria-hidden="true">＋</span>
        <p>
          오늘의 건강 상태를 기록해 볼까요? 체온·심박수·호흡수를 입력하면 변화 그래프로 확인할 수 있어요.
        </p>
        <Link to={`/pets/${selectedPet.id}/questionnaire`}>오늘 기록 입력하기</Link>
      </aside>

      {isLoading && <DataState title="건강 문진 기록을 불러오는 중입니다." isLoading />}
      {error && (
        <DataState title="건강 문진 기록을 불러오지 못했습니다." tone="error">
          {error}
        </DataState>
      )}
      {predictionNotice && <p className={styles.predictionNotice}>{predictionNotice}</p>}
      {!predictionNotice && unanalyzedCount > 0 && (
        <aside className={styles.analysisNotice} role="status">
          <span aria-hidden="true">!</span>
          <p>
            <strong>AI 분석을 완료하지 않은 건강 기록이 {unanalyzedCount}건 있어요.</strong>
            입력한 건강 수치는 그래프에 포함되며, 건강 기록에서 나중에 분석할 수 있습니다.
          </p>
          <Link to={`/pets/${selectedPet.id}/history?tab=history&status=PENDING`}>미분석 기록 확인</Link>
        </aside>
      )}

      {!isLoading && !error && latest && (
        <>
          <section className={shared.gridThree} aria-label="최근 입력한 건강 수치">
            {(Object.keys(metricConfig) as MetricKey[]).map((metricKey) => {
              const item = metricConfig[metricKey]
              const difference = previous ? latest[metricKey] - previous[metricKey] : null

              return (
                <article className={styles.vitalCard} key={metricKey}>
                  <div>
                    <span aria-hidden="true">{item.icon}</span>
                    <p>{item.label}</p>
                    <small className={getRiskTone(latestPrediction?.riskGrade)}>{statusLabel}</small>
                  </div>
                  <strong>
                    {formatMetricValue(latest[metricKey], metricKey)}
                    <em>{item.unit}</em>
                  </strong>
                  <p>
                    {difference === null
                      ? '첫 문진 입력 기록'
                      : `이전 문진 대비 ${difference > 0 ? '+' : ''}${difference.toFixed(item.decimals)} ${item.unit}`}
                  </p>
                </article>
              )
            })}
          </section>

          <section className={`${shared.panel} ${styles.chartPanel}`}>
            <div className={styles.panelHeader}>
              <div>
                <p>QUESTIONNAIRE TREND</p>
                <h2>문진 수치 변화</h2>
              </div>
              <div className={styles.periodButtons} aria-label="그래프 표시 단위">
                {TREND_VIEW_OPTIONS.map((option) => (
                  <button
                    type="button"
                    className={scale === option.value ? styles.active : ''}
                    aria-pressed={scale === option.value}
                    onClick={() => setScale(option.value)}
                    key={option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.chartMeta}>
              <div className={styles.metricButtons} aria-label="그래프 건강 항목">
                {(Object.keys(metricConfig) as MetricKey[]).map((metricKey) => (
                  <button
                    type="button"
                    aria-pressed={metric === metricKey}
                    className={metric === metricKey ? styles.metricActive : ''}
                    onClick={() => setMetric(metricKey)}
                    key={metricKey}
                  >
                    <i style={{ backgroundColor: metricConfig[metricKey].color }} />
                    {metricConfig[metricKey].label}
                  </button>
                ))}
              </div>
              <span>{scaleLabels[scale]} · 입력 {visibleRecords.length}건</span>
            </div>

            {visibleRecords.length > 0 ? (
              <>
                <div
                  className={styles.chartFrame}
                  role="img"
                  aria-label={`${scaleLabels[scale]} ${selectedMetric.label} 변화 그래프, 문진 입력 ${visibleRecords.length}건`}
                >
                  <div className={styles.yAxis} aria-hidden="true">
                    {valueTicks.map((tick) => (
                      <span key={tick}>{tick.toFixed(selectedMetric.decimals)}</span>
                    ))}
                    <small>{selectedMetric.unit}</small>
                  </div>
                  <div className={styles.chart}>
                    <div className={styles.gridLines} aria-hidden="true">
                      {valueTicks.map((tick) => <span key={tick} />)}
                    </div>
                    <svg viewBox="0 0 800 220" preserveAspectRatio="none" aria-hidden="true">
                      {points.length > 1 && (
                        <polyline
                          className={styles.metricLine}
                          style={{ stroke: selectedMetric.color }}
                          points={points.map((point) => `${point.x},${point.y}`).join(' ')}
                        />
                      )}
                      {points.map((point) => (
                        <circle
                          className={styles.metricPoint}
                          style={{ fill: selectedMetric.color }}
                          cx={point.x}
                          cy={point.y}
                          r="6"
                          key={point.record.questionnaireId}
                        >
                          <title>
                            {`${formatSubmittedAt(point.record.submittedAt)} · ${selectedMetric.label} ${formatMetricValue(point.record[metric], metric)}${selectedMetric.unit}`}
                          </title>
                        </circle>
                      ))}
                    </svg>
                    <div className={styles.xAxis} aria-hidden="true">
                      {timeTicks.map((tick) => (
                        <span key={tick}>{formatQuestionnaireTrendTick(tick, scale)}</span>
                      ))}
                    </div>
                  </div>
                </div>
                {visibleRecords.length === 1 && (
                  <p className={styles.singleRecordNotice}>비교할 기록이 아직 부족해 입력값 한 건만 표시합니다.</p>
                )}
              </>
            ) : (
              <div className={styles.emptyChart} role="status">
                <span aria-hidden="true">⌁</span>
                <p>선택한 범위에 건강 문진 기록이 없습니다.</p>
                <Link to={`/pets/${selectedPet.id}/questionnaire`}>건강 문진 입력하기</Link>
              </div>
            )}
          </section>

          <section className={`${shared.panel} ${styles.historyPanel}`}>
            <div className={styles.panelHeader}>
              <div>
                <p>RECENT RECORDS</p>
                <h2>문진 입력 기록</h2>
              </div>
            </div>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>입력 시각</th>
                    <th>체온</th>
                    <th>심박수</th>
                    <th>호흡수</th>
                    <th>AI 분석</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRecords.map((row) => {
                    const prediction = predictionByQuestionnaireId.get(row.questionnaireId)
                    const detailPath = `/pets/${selectedPet.id}/health-records/${row.questionnaireId}`
                    return (
                      <tr
                        className={styles.clickableRow}
                        role="link"
                        tabIndex={0}
                        aria-label={`${formatSubmittedAt(row.submittedAt)} 건강 기록 자세히 보기`}
                        onClick={() => navigate(detailPath)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            navigate(detailPath)
                          }
                        }}
                        key={row.questionnaireId}
                      >
                        <td>{formatSubmittedAt(row.submittedAt)}</td>
                        <td>{row.temperature.toFixed(1)}°C</td>
                        <td>{row.heartRate} bpm</td>
                        <td>{row.respiratoryRate}회/분</td>
                        <td>
                          <span className={getRiskTone(prediction?.riskGrade)}>
                            {prediction ? riskLabels[prediction.riskGrade] : '분석 전'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {!isLoading && !error && !latest && (
        <DataState
          title="아직 입력한 건강 문진이 없습니다."
          action={<Link to={`/pets/${selectedPet.id}/questionnaire`}>첫 건강 문진 입력하기</Link>}
        >
          문진에 체온·심박수·호흡수를 입력하면 이곳에 변화 그래프가 표시됩니다.
        </DataState>
      )}
    </div>
  )
}
