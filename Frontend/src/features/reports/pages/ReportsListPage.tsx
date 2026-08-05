import { Link } from 'react-router-dom'
import { PetSectionNav } from '../../pets/components/PetSectionNav'
import { usePets } from '../../pets/hooks/usePets'
import common from '../../../styles/featurePage.module.css'
import styles from './ReportPages.module.css'

const reports = [
  { id: 'weekly-2026-08-04', period: '07.29 — 08.04', score: 86, change: '+8', status: '좋음', summary: '활동량이 회복되고 수면 리듬이 안정적이에요.' },
  { id: 'weekly-2026-07-28', period: '07.22 — 07.28', score: 78, change: '-3', status: '관찰', summary: '수분 섭취량이 평소보다 조금 낮았어요.' },
  { id: 'weekly-2026-07-21', period: '07.15 — 07.21', score: 81, change: '+2', status: '좋음', summary: '식욕과 배변 기록이 일정하게 유지됐어요.' },
]

export function ReportsListPage() {
  const { selectedPet } = usePets()

  return (
    <div className={common.page}>
      <PetSectionNav />
      <header className={common.header}>
        <div>
          <p className={common.eyebrow}>WEEKLY WELLNESS REPORT</p>
          <h1 className={common.title}>주간 건강 리포트</h1>
          <p className={common.description}>{selectedPet.name}의 일주일 건강 기록을 한눈에 비교해 보세요.</p>
        </div>
        <button className={common.secondaryButton} type="button">리포트 알림 설정</button>
      </header>

      <section className={styles.latestReport}>
        <div>
          <span className={styles.kicker}>LATEST REPORT · 07.29 — 08.04</span>
          <h2>이번 주의 작은 변화가<br />건강한 흐름을 만들었어요.</h2>
          <p>산책 시간이 일정해지며 활동 점수가 지난주보다 8점 올랐어요.</p>
          <Link className={common.primaryButton} to={`/reports/${reports[0].id}`}>최신 리포트 자세히 보기</Link>
        </div>
        <div className={styles.scoreVisual} aria-label="이번 주 건강 점수 86점">
          <small>WEEKLY SCORE</small><strong>86</strong><span>지난주보다 +8</span>
        </div>
      </section>

      <section className={styles.reportSection}>
        <div className={styles.sectionHeading}><h2 className={common.sectionTitle}>지난 리포트</h2><span>최근 12주까지 제공돼요</span></div>
        <div className={styles.reportList}>
          {reports.map((report) => (
            <article className={styles.reportCard} key={report.id}>
              <time>{report.period}</time>
              <div><span className={report.status === '좋음' ? styles.goodBadge : styles.watchBadge}>{report.status}</span><h3>{report.summary}</h3></div>
              <div className={styles.reportScore}><strong>{report.score}</strong><small>{report.change}</small></div>
              <Link to={`/reports/${report.id}`} aria-label={`${report.period} 리포트 보기`}>→</Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
