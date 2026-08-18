import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DataState } from '../../../components/common/DataState'
import { getHealthAlerts, type HealthAlert } from '../../history/api/healthHistoryApi'
import { PetSelector } from '../../pets/components/PetSelector'
import { usePets } from '../../pets/hooks/usePets'
import { getPredictionByQuestionnaire, type HealthPrediction } from '../../predictions/api/predictionApi'
import { getQuestionnaires } from '../../questionnaire/api/questionnaireApi'
import { getWeeklyReports, type WeeklyReport } from '../../reports/api/reportApi'
import { getLatestVital, type VitalRecord } from '../../vitals/api/vitalApi'
import styles from './DashboardPage.module.css'

const demoVitals = [
  { label: '체온', value: '38.4', unit: '°C', note: '평소 범위예요', icon: '♨' },
  { label: '심박수', value: '92', unit: 'bpm', note: '안정적으로 보여요', icon: '♥' },
  { label: '호흡수', value: '24', unit: '회/분', note: '최근 측정 기준', icon: '⌁' },
]

const weeklyData = [48, 56, 53, 68, 72, 64, 78]

export function DashboardPage() {
  const { selectedPet, isLoading, isDemoMode } = usePets()
  const [latestVital, setLatestVital] = useState<VitalRecord | null>(null)
  const [latestAlert, setLatestAlert] = useState<HealthAlert | null>(null)
  const [latestPrediction, setLatestPrediction] = useState<HealthPrediction | null>(null)
  const [latestReport, setLatestReport] = useState<WeeklyReport | null>(null)

  useEffect(() => {
    if (!selectedPet || isDemoMode) {
      setLatestVital(null)
      setLatestAlert(null)
      setLatestPrediction(null)
      setLatestReport(null)
      return
    }

    const controller = new AbortController()
    Promise.all([
      getLatestVital(selectedPet.id, controller.signal).catch(() => null),
      getHealthAlerts(selectedPet.id, controller.signal).catch(() => []),
      getQuestionnaires(selectedPet.id, controller.signal).catch(() => []),
      getWeeklyReports(selectedPet.id, controller.signal).catch(() => []),
    ]).then(async ([vital, alerts, questionnaires, reports]) => {
      setLatestVital(vital)
      setLatestAlert(alerts.find((alert) => !alert.isRead) ?? alerts[0] ?? null)
      setLatestReport(reports[0] ?? null)

      if (questionnaires[0]) {
        const prediction = await getPredictionByQuestionnaire(questionnaires[0].questionnaireId, controller.signal).catch(() => null)
        setLatestPrediction(prediction)
      } else {
        setLatestPrediction(null)
      }
    })

    return () => controller.abort()
  }, [isDemoMode, selectedPet])

  if (isLoading) {
    return <div className={styles.page}><DataState title="아이들의 상태를 불러오고 있습니다." isLoading /></div>
  }

  if (!selectedPet) {
    return <div className={styles.page}><DataState title="등록된 반려동물이 없습니다." action={<Link to="/pets/new">반려동물 등록하기</Link>} /></div>
  }

  const petBase = `/pets/${selectedPet.id}`
  const vitals = latestVital ? [
    { label: '체온', value: String(latestVital.temperature), unit: '°C', note: '최근 측정값', icon: '♨' },
    { label: '심박수', value: String(latestVital.heartRate), unit: 'bpm', note: '최근 측정값', icon: '♥' },
    { label: '호흡수', value: String(latestVital.respiratoryRate), unit: '회/분', note: '최근 측정값', icon: '⌁' },
  ] : isDemoMode ? demoVitals : [
    { label: '체온', value: '-', unit: '°C', note: '측정 기록 없음', icon: '♨' },
    { label: '심박수', value: '-', unit: 'bpm', note: '측정 기록 없음', icon: '♥' },
    { label: '호흡수', value: '-', unit: '회/분', note: '측정 기록 없음', icon: '⌁' },
  ]
  const riskPercent = latestPrediction ? Math.round(Number(latestPrediction.abnormalProbability) * 100) : null
  const healthScore = riskPercent == null ? 86 : 100 - riskPercent
  const overallTitle = latestPrediction
    ? latestPrediction.riskGrade === 'NORMAL' ? '최근 기록은 정상 범위예요' : '최근 건강 신호를 관찰해 주세요'
    : '아직 생성된 예측 결과가 없어요'
  const insightTitle = latestReport?.oneLineSummary ?? (latestPrediction ? '최근 AI 예측 결과를 확인해 보세요.' : '건강 문진을 시작해 보세요.')
  const insightCopy = latestReport?.reportContent ?? latestPrediction?.aiSummary ?? '문진과 생체정보가 쌓이면 AI 건강 인사이트가 표시됩니다.'
  const chartData = isDemoMode ? weeklyData : [0, 0, 0, 0, 0, 0, 0]

  return (
    <div className={styles.page}>
      <section className={styles.welcome}>
        <div>
          <p className={styles.eyebrow}>TODAY'S PET WELLNESS</p>
          <h1>안녕하세요, 보호자님.</h1>
          <p>{selectedPet.name}의 오늘 건강 신호를 차분하게 살펴볼까요?</p>
        </div>
        <PetSelector />
      </section>

      <section className={styles.summaryGrid} aria-label="건강 상태 요약">
        <article className={styles.overallCard}>
          <div className={styles.cardHeading}>
            <div>
              <p>오늘의 건강 신호</p>
              <h2>{overallTitle}</h2>
            </div>
            <span className={styles.normalBadge}>{latestPrediction?.riskGrade ?? (isDemoMode ? 'DEMO' : '기록 전')}</span>
          </div>
          <div className={styles.scoreArea}>
            <div className={styles.scoreRing} aria-label={`건강 점수 ${healthScore}점`}>
              <strong>{healthScore}</strong>
              <small>/ 100</small>
            </div>
            <p>
              {latestPrediction?.aiSummary ?? '오늘의 건강 문진을 완료하면 실제 위험도 기준 점수가 표시됩니다.'}
            </p>
          </div>
          <Link className={styles.darkButton} to={`${petBase}/questionnaire`}>오늘 건강 문진 시작하기</Link>
        </article>

        <article className={styles.noticeCard}>
          <span className={styles.noticeIcon} aria-hidden="true">✦</span>
          <div>
            <p>{latestAlert ? '최근 건강 알림' : '건강 알림'}</p>
            <h2>{latestAlert?.title ?? '새로운 알림이 없어요'}</h2>
            <small>{latestAlert?.message ?? '건강 기록을 꾸준히 남겨 주세요.'}</small>
          </div>
          <Link to={`${petBase}/history`}>알림 확인</Link>
        </article>
      </section>

      <section className={styles.vitalsSection}>
        <div className={styles.sectionTitle}>
          <div>
            <p>LIVE HEALTH SIGNALS</p>
            <h2>최근 생체정보</h2>
          </div>
          <Link to={`${petBase}/vitals`}>전체 기록 보기 <span aria-hidden="true">→</span></Link>
        </div>

        <div className={styles.vitalGrid}>
          {vitals.map((vital) => (
            <article className={styles.vitalCard} key={vital.label}>
              <div className={styles.vitalTop}>
                <span aria-hidden="true">{vital.icon}</span>
                <p>{vital.label}</p>
                <small>{latestVital?.status ?? (isDemoMode ? 'DEMO' : '기록 전')}</small>
              </div>
              <div className={styles.vitalValue}>
                <strong>{vital.value}</strong>
                <span>{vital.unit}</span>
              </div>
              <p className={styles.vitalNote}>{vital.note}</p>
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
            <button type="button" disabled={!isDemoMode}>{isDemoMode ? '최근 7일 ⌄' : '활동 API 준비 필요'}</button>
          </div>
          <div className={styles.chart} aria-label="최근 7일 활동량 막대그래프">
            {chartData.map((value, index) => (
              <div className={styles.chartColumn} key={`${value}-${index}`}>
                <div className={styles.chartTrack}>
                  <span style={{ height: `${value}%` }} />
                </div>
                <small>{['월', '화', '수', '목', '금', '토', '일'][index]}</small>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.insightCard}>
          <p className={styles.insightLabel}>AI HEALTH INSIGHT</p>
          <span className={styles.insightIcon} aria-hidden="true">◎</span>
          <h2>{insightTitle}</h2>
          <p>{insightCopy}</p>
          <Link to={`${petBase}/reports`}>주간 리포트 확인하기 <span aria-hidden="true">→</span></Link>
        </article>
      </section>
    </div>
  )
}
