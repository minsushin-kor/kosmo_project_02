import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DataState } from '../../../components/common/DataState'
import { getApiErrorMessage } from '../../../shared/api/apiClient'
import { PetSectionNav } from '../../pets/components/PetSectionNav'
import { useRoutePet } from '../../pets/hooks/useRoutePet'
import { getVitalRecords, type VitalRecord } from '../api/vitalApi'
import shared from '../../../styles/featurePage.module.css'
import styles from './VitalMonitoringPage.module.css'

type Period = '24시간' | '7일' | '30일'

const demoMeasurements: VitalRecord[] = [
  { vitalRecordId: 1, petId: 0, temperature: 38.4, heartRate: 92, respiratoryRate: 24, measuredAt: '2026-08-18T08:30:00', sourceType: 'MANUAL', status: 'NORMAL' },
  { vitalRecordId: 2, petId: 0, temperature: 38.6, heartRate: 96, respiratoryRate: 25, measuredAt: '2026-08-17T20:10:00', sourceType: 'MANUAL', status: 'NORMAL' },
  { vitalRecordId: 3, petId: 0, temperature: 38.5, heartRate: 94, respiratoryRate: 24, measuredAt: '2026-08-17T08:25:00', sourceType: 'MANUAL', status: 'NORMAL' },
  { vitalRecordId: 4, petId: 0, temperature: 38.8, heartRate: 101, respiratoryRate: 28, measuredAt: '2026-08-16T20:05:00', sourceType: 'MANUAL', status: 'WATCH' },
]

function formatMeasuredAt(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function buildPoints(records: VitalRecord[], selector: (record: VitalRecord) => number) {
  if (records.length === 0) {
    return ''
  }

  const ordered = [...records].reverse()
  const values = ordered.map(selector)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  return ordered.map((record, index) => {
    const x = ordered.length === 1 ? 400 : (index / (ordered.length - 1)) * 800
    const y = 185 - ((selector(record) - min) / range) * 100
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

export function VitalMonitoringPage() {
  const { selectedPet, routePetMissing, isDemoMode } = useRoutePet()
  const [period, setPeriod] = useState<Period>('7일')
  const [records, setRecords] = useState<VitalRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedPet) {
      return
    }

    if (isDemoMode) {
      setRecords(demoMeasurements)
      setError('')
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setError('')
    getVitalRecords(selectedPet.id, controller.signal)
      .then((items) => setRecords([...items].sort((a, b) => Date.parse(b.measuredAt) - Date.parse(a.measuredAt))))
      .catch((loadError) => {
        if (!(loadError instanceof DOMException && loadError.name === 'AbortError')) {
          setError(getApiErrorMessage(loadError, '생체정보를 불러오지 못했습니다.'))
        }
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [isDemoMode, selectedPet])

  const visibleRecords = useMemo(() => {
    if (isDemoMode) {
      return records
    }

    const hours = period === '24시간' ? 24 : period === '7일' ? 24 * 7 : 24 * 30
    const threshold = Date.now() - hours * 60 * 60 * 1000
    return records.filter((record) => Date.parse(record.measuredAt) >= threshold)
  }, [isDemoMode, period, records])

  if (!selectedPet || routePetMissing) {
    return <div className={shared.page}><DataState title="반려동물 정보를 찾을 수 없습니다." action={<Link to="/pets">반려동물 목록으로 이동</Link>} /></div>
  }

  const latest = visibleRecords[0] ?? records[0]
  const previous = visibleRecords[1] ?? records[1]
  const statusLabel = latest?.status === 'NORMAL' ? '정상' : latest?.status === 'WATCH' ? '관찰' : '주의'

  const exportCsv = () => {
    const rows = [
      ['measuredAt', 'temperature', 'heartRate', 'respiratoryRate', 'status'],
      ...visibleRecords.map((record) => [record.measuredAt, record.temperature, record.heartRate, record.respiratoryRate, record.status]),
    ]
    const csv = rows.map((row) => row.join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedPet.name}-vitals.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PetSectionNav />
      <div className={shared.page}>
        <header className={shared.header}>
          <div><p className={shared.eyebrow}>VITAL MONITORING</p><h1 className={shared.title}>생체정보 모니터링</h1><p className={shared.description}>{selectedPet.name}의 체온·심박수·호흡수 변화를 시간순으로 확인합니다.</p></div>
          <span className={shared.mockBadge}>{isDemoMode ? '데모 측정 기록' : latest ? `최근 측정 ${formatMeasuredAt(latest.measuredAt)}` : '측정 기록 없음'}</span>
        </header>

        {isLoading && <DataState title="생체정보를 불러오는 중입니다." />}
        {error && <DataState title="생체정보를 불러오지 못했습니다." tone="error">{error}</DataState>}
        {!isLoading && !error && !latest && <DataState title="아직 저장된 생체정보가 없습니다.">생체정보가 등록되면 최신값과 변화 그래프가 표시됩니다.</DataState>}

        {latest && <>
          <section className={shared.gridThree} aria-label="최신 생체정보">
            <article className={styles.vitalCard}><div><span aria-hidden="true">♨</span><p>체온</p><small>{statusLabel}</small></div><strong>{latest.temperature}<em>°C</em></strong><p>{previous ? `이전 측정 대비 ${(latest.temperature - previous.temperature).toFixed(1)}°C` : '첫 측정 기록'}</p></article>
            <article className={styles.vitalCard}><div><span aria-hidden="true">♥</span><p>심박수</p><small>{statusLabel}</small></div><strong>{latest.heartRate}<em>bpm</em></strong><p>{previous ? `이전 측정 대비 ${latest.heartRate - previous.heartRate} bpm` : '첫 측정 기록'}</p></article>
            <article className={styles.vitalCard}><div><span aria-hidden="true">⌁</span><p>호흡수</p><small>{statusLabel}</small></div><strong>{latest.respiratoryRate}<em>회/분</em></strong><p>{previous ? `이전 측정 대비 ${latest.respiratoryRate - previous.respiratoryRate}회` : '첫 측정 기록'}</p></article>
          </section>

          <section className={`${shared.panel} ${styles.chartPanel}`}>
            <div className={styles.panelHeader}>
              <div><p>VITAL TREND</p><h2>최근 측정 흐름</h2></div>
              <div className={styles.periodButtons} aria-label="조회 기간">
                {(['24시간', '7일', '30일'] as Period[]).map((item) => <button type="button" className={period === item ? styles.active : ''} onClick={() => setPeriod(item)} key={item}>{item}</button>)}
              </div>
            </div>
            <div className={styles.legend}><span><i className={styles.temperature} />체온</span><span><i className={styles.heart} />심박수</span><span><i className={styles.breath} />호흡수</span></div>
            <div className={styles.chart} role="img" aria-label={`${period} 동안의 생체정보 변화 그래프`}>
              <div className={styles.gridLines}>{[0, 1, 2, 3].map((line) => <span key={line} />)}</div>
              <svg viewBox="0 0 800 220" preserveAspectRatio="none" aria-hidden="true">
                <polyline className={styles.temperatureLine} points={buildPoints(visibleRecords, (record) => record.temperature)} />
                <polyline className={styles.heartLine} points={buildPoints(visibleRecords, (record) => record.heartRate)} />
                <polyline className={styles.breathLine} points={buildPoints(visibleRecords, (record) => record.respiratoryRate)} />
              </svg>
              <div className={styles.xAxis}>{visibleRecords.slice().reverse().map((record) => <span key={record.vitalRecordId}>{new Date(record.measuredAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}</span>)}</div>
            </div>
          </section>

          <section className={`${shared.panel} ${styles.historyPanel}`}>
            <div className={styles.panelHeader}><div><p>RECENT RECORDS</p><h2>최근 측정 기록</h2></div><button type="button" onClick={exportCsv}>CSV 내보내기</button></div>
            <div className={styles.tableWrap}>
              <table><thead><tr><th>측정 시각</th><th>체온</th><th>심박수</th><th>호흡수</th><th>상태</th></tr></thead><tbody>{visibleRecords.map((row) => <tr key={row.vitalRecordId}><td>{formatMeasuredAt(row.measuredAt)}</td><td>{row.temperature}°C</td><td>{row.heartRate} bpm</td><td>{row.respiratoryRate}회/분</td><td><span className={row.status === 'NORMAL' ? styles.normal : styles.watch}>{row.status === 'NORMAL' ? '정상' : '관찰'}</span></td></tr>)}</tbody></table>
            </div>
          </section>
        </>}
      </div>
    </>
  )
}
