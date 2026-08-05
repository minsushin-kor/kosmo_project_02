import { Link, useParams } from 'react-router-dom'
import { PetSectionNav } from '../../pets/components/PetSectionNav'
import { usePets } from '../../pets/hooks/usePets'
import common from '../../../styles/featurePage.module.css'
import styles from './ReportPages.module.css'

const stats = [
  { label: '평균 활동', value: '64분', change: '+12%' },
  { label: '평균 수면', value: '11.2시간', change: '+3%' },
  { label: '식사 기록', value: '14회', change: '100%' },
  { label: '주의 알림', value: '1회', change: '-2회' },
]

export function ReportDetailPage() {
  const { reportId } = useParams()
  const { selectedPet } = usePets()

  return (
    <div className={common.page}>
      <PetSectionNav />
      <Link className={styles.backLink} to={`/pets/${selectedPet.id}/reports`}>← 주간 리포트 목록</Link>
      <header className={common.header}>
        <div>
          <p className={common.eyebrow}>07.29 — 08.04 · WEEK 31</p>
          <h1 className={common.title}>{selectedPet.name}의<br />한 주 건강 기록</h1>
          <p className={common.description}>매일의 작은 기록을 모아 지난주와 비교했어요.</p>
        </div>
        <div className={styles.detailScore}><small>건강 점수</small><strong>86</strong><span>+8</span></div>
      </header>

      <section className={styles.statGrid} aria-label="주간 건강 지표">
        {stats.map((stat) => <article key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.change}</small></article>)}
      </section>

      <div className={styles.detailGrid}>
        <section className={`${common.panel} ${styles.weeklyChart}`}>
          <div className={styles.sectionHeading}><h2 className={common.sectionTitle}>일별 활동 흐름</h2><span>권장 활동 60분</span></div>
          <div className={styles.bars} aria-label="요일별 활동 시간 막대그래프">
            {[48, 58, 54, 72, 66, 82, 70].map((value, index) => (
              <div key={index}><div><span style={{ height: `${value}%` }} /></div><small>{['월', '화', '수', '목', '금', '토', '일'][index]}</small></div>
            ))}
          </div>
        </section>

        <aside className={styles.aiSummary}>
          <span>AI WEEKLY INSIGHT</span>
          <h2>주말 산책이 이번 주 활동 회복을 이끌었어요.</h2>
          <p>평일 활동도 10분씩만 늘리면 더 안정적인 리듬을 만들 수 있어요. 더운 시간대는 피하고 산책 후 수분 섭취를 확인해 주세요.</p>
        </aside>
      </div>

      <section className={`${common.panel} ${styles.comparison}`}>
        <h2 className={common.sectionTitle}>지난주와 비교</h2>
        <div className={styles.comparisonRows}>
          <div><span>활동 균형</span><div><i className={styles.previousBar} /><i className={styles.currentBarLong} /></div><strong>+12%</strong></div>
          <div><span>수면 규칙성</span><div><i className={styles.previousBarLong} /><i className={styles.currentBar} /></div><strong>+3%</strong></div>
          <div><span>수분 기록</span><div><i className={styles.previousBarShort} /><i className={styles.currentBarShort} /></div><strong>-4%</strong></div>
        </div>
      </section>

      <aside className={styles.reportDisclaimer}>이 리포트는 기록된 데이터를 요약한 건강관리 참고 자료이며 수의학적 진단을 대신하지 않습니다. <small>리포트 ID: {reportId}</small></aside>
    </div>
  )
}
