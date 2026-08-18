import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DataState } from '../../../components/common/DataState'
import { getApiErrorMessage } from '../../../shared/api/apiClient'
import { PetSectionNav } from '../../pets/components/PetSectionNav'
import { useRoutePet } from '../../pets/hooks/useRoutePet'
import { createWeeklyReport, getWeeklyReports, type WeeklyReport } from '../api/reportApi'
import common from '../../../styles/featurePage.module.css'
import styles from './ReportPages.module.css'

function formatPeriod(report: WeeklyReport) {
  const formatter = new Intl.DateTimeFormat('ko-KR', { month: '2-digit', day: '2-digit' })
  return `${formatter.format(new Date(report.startDate))} — ${formatter.format(new Date(report.endDate))}`
}

function getWellnessScore(report: WeeklyReport) {
  return Math.max(0, Math.round((1 - Number(report.averageRiskProbability ?? 0)) * 100))
}

function getReportStatus(report: WeeklyReport) {
  if (report.dangerCount > 0) return '위험'
  if (report.warningCount > 0) return '관찰'
  return '좋음'
}

export function ReportsListPage() {
  const { selectedPet, routePetMissing, isDemoMode } = useRoutePet()
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedPet || isDemoMode) {
      setReports([])
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setError('')
    getWeeklyReports(selectedPet.id, controller.signal)
      .then(setReports)
      .catch((loadError) => {
        if (!(loadError instanceof DOMException && loadError.name === 'AbortError')) {
          setError(getApiErrorMessage(loadError, '주간 리포트를 불러오지 못했습니다.'))
        }
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [isDemoMode, selectedPet])

  if (!selectedPet || routePetMissing) {
    return <div className={common.page}><DataState title="반려동물 정보를 찾을 수 없습니다." action={<Link to="/pets">반려동물 목록으로 이동</Link>} /></div>
  }

  const handleCreate = async () => {
    setIsCreating(true)
    setError('')
    try {
      const created = await createWeeklyReport(selectedPet.id)
      setReports((current) => [created, ...current.filter((report) => report.reportId !== created.reportId)])
    } catch (createError) {
      setError(getApiErrorMessage(createError, '주간 리포트를 생성하지 못했습니다.'))
    } finally {
      setIsCreating(false)
    }
  }

  const latest = reports[0]

  return (
    <div className={common.page}>
      <PetSectionNav />
      <header className={common.header}>
        <div>
          <p className={common.eyebrow}>WEEKLY WELLNESS REPORT</p>
          <h1 className={common.title}>주간 건강 리포트</h1>
          <p className={common.description}>{selectedPet.name}의 일주일 건강 기록을 한눈에 비교해 보세요.</p>
        </div>
        <button className={common.secondaryButton} type="button" disabled={isDemoMode || isCreating} onClick={() => void handleCreate()}>{isCreating ? '생성 중...' : '이번 주 리포트 생성'}</button>
      </header>

      {isDemoMode && <DataState title="리포트 API를 사용하려면 Spring Boot 연결이 필요합니다.">PostgreSQL과 Spring Boot를 실행하면 저장된 주간 리포트를 조회하고 새 리포트를 생성할 수 있습니다.</DataState>}
      {isLoading && <DataState title="주간 리포트를 불러오는 중입니다." />}
      {error && <DataState title="주간 리포트를 처리하지 못했습니다." tone="error">{error}</DataState>}

      {latest ? <>
        <section className={styles.latestReport}>
          <div>
            <span className={styles.kicker}>LATEST REPORT · {formatPeriod(latest)}</span>
            <h2>{latest.oneLineSummary || '이번 주의 건강 기록을 확인해 보세요.'}</h2>
            <p>{latest.reportContent || '저장된 생체정보와 건강 문진을 바탕으로 생성된 리포트입니다.'}</p>
            <Link className={common.primaryButton} to={`/reports/${latest.reportId}`}>최신 리포트 자세히 보기</Link>
          </div>
          <div className={styles.scoreVisual} aria-label={`이번 주 건강 점수 ${getWellnessScore(latest)}점`}>
            <small>WELLNESS SCORE</small><strong>{getWellnessScore(latest)}</strong><span>위험 확률 기준 환산</span>
          </div>
        </section>

        <section className={styles.reportSection}>
          <div className={styles.sectionHeading}><h2 className={common.sectionTitle}>지난 리포트</h2><span>총 {reports.length}건</span></div>
          <div className={styles.reportList}>
            {reports.map((report) => {
              const status = getReportStatus(report)
              return (
                <article className={styles.reportCard} key={report.reportId}>
                  <time>{formatPeriod(report)}</time>
                  <div><span className={status === '좋음' ? styles.goodBadge : styles.watchBadge}>{status}</span><h3>{report.oneLineSummary || '주간 건강 기록'}</h3></div>
                  <div className={styles.reportScore}><strong>{getWellnessScore(report)}</strong><small>{Math.round(Number(report.averageRiskProbability ?? 0) * 100)}% 위험</small></div>
                  <Link to={`/reports/${report.reportId}`} aria-label={`${formatPeriod(report)} 리포트 보기`}>→</Link>
                </article>
              )
            })}
          </div>
        </section>
      </> : !isLoading && !isDemoMode && !error && <DataState title="생성된 주간 리포트가 없습니다.">이번 주 리포트 생성 버튼을 눌러 첫 리포트를 만들어 보세요.</DataState>}
    </div>
  )
}
