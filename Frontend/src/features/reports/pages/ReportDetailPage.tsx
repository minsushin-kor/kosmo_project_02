import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DataState } from '../../../components/common/DataState'
import { getApiErrorMessage } from '../../../shared/api/apiClient'
import { PetSectionNav } from '../../pets/components/PetSectionNav'
import { usePets } from '../../pets/hooks/usePets'
import { getWeeklyReport, type WeeklyReport } from '../api/reportApi'
import common from '../../../styles/featurePage.module.css'
import styles from './ReportPages.module.css'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value))
}

export function ReportDetailPage() {
  const { reportId } = useParams()
  const { pets, selectedPet, selectPet } = usePets()
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!reportId) {
      setError('리포트 ID가 없습니다.')
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    getWeeklyReport(reportId, controller.signal)
      .then((loadedReport) => {
        setReport(loadedReport)
        const reportPet = pets.find((pet) => pet.id === String(loadedReport.petId))
        if (reportPet) selectPet(reportPet.id)
      })
      .catch((loadError) => {
        if (!(loadError instanceof DOMException && loadError.name === 'AbortError')) {
          setError(getApiErrorMessage(loadError, '주간 리포트를 불러오지 못했습니다.'))
        }
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [pets, reportId, selectPet])

  if (isLoading) {
    return <div className={common.page}><DataState title="주간 리포트를 불러오는 중입니다." isLoading /></div>
  }

  if (!report || error) {
    return <div className={common.page}><DataState title="주간 리포트를 표시할 수 없습니다." tone="error" action={<Link to="/pets">반려동물 목록으로 이동</Link>}>{error}</DataState></div>
  }

  const wellnessScore = Math.max(0, Math.round((1 - Number(report.averageRiskProbability ?? 0)) * 100))
  const petBase = selectedPet ? `/pets/${selectedPet.id}` : '/pets'
  const stats = [
    { label: '평균 체온', value: report.averageTemperature == null ? '-' : `${report.averageTemperature}°C`, change: '주간 평균' },
    { label: '평균 심박수', value: report.averageHeartRate == null ? '-' : `${report.averageHeartRate} bpm`, change: '주간 평균' },
    { label: '건강 문진', value: `${report.questionnaireCount}회`, change: '최근 7일' },
    { label: '주의·위험 알림', value: `${report.warningCount + report.dangerCount}회`, change: `위험 ${report.dangerCount}회` },
  ]

  return (
    <div className={common.page}>
      <PetSectionNav />
      <Link className={styles.backLink} to={`${petBase}/reports`}>← 주간 리포트 목록</Link>
      <header className={common.header}>
        <div>
          <p className={common.eyebrow}>{formatDate(report.startDate)} — {formatDate(report.endDate)}</p>
          <h1 className={common.title}>{selectedPet ? `${selectedPet.name}의` : '반려동물의'}<br />한 주 건강 기록</h1>
          <p className={common.description}>{report.oneLineSummary || '매일의 건강 기록을 모아 한 주의 흐름을 정리했습니다.'}</p>
        </div>
        <div className={styles.detailScore}><small>건강 점수</small><strong>{wellnessScore}</strong><span>위험 {Math.round(Number(report.averageRiskProbability ?? 0) * 100)}%</span></div>
      </header>

      <section className={styles.statGrid} aria-label="주간 건강 지표">
        {stats.map((stat) => <article key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.change}</small></article>)}
      </section>

      <div className={styles.detailGrid}>
        <section className={`${common.panel} ${styles.weeklyChart}`}>
          <div className={styles.sectionHeading}><h2 className={common.sectionTitle}>AI 주간 분석</h2><span>저장된 데이터 기반</span></div>
          <p>{report.reportContent || '이번 주에 기록된 건강 데이터를 확인하고 꾸준히 변화를 관찰해 주세요.'}</p>
        </section>
        <aside className={styles.aiSummary}>
          <span>WEEKLY SUMMARY</span>
          <h2>{report.oneLineSummary || '이번 주 건강 기록이 생성되었습니다.'}</h2>
          <p>주의 알림 {report.warningCount}회, 위험 알림 {report.dangerCount}회, 건강 문진 {report.questionnaireCount}회가 반영되었습니다.</p>
        </aside>
      </div>

      <aside className={styles.reportDisclaimer}>이 리포트는 기록된 데이터를 요약한 건강관리 참고 자료이며 수의학적 진단을 대신하지 않습니다. <small>리포트 ID: {report.reportId}</small></aside>
    </div>
  )
}
