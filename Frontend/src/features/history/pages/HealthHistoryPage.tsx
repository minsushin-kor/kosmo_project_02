import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PetSectionNav } from '../../pets/components/PetSectionNav'
import { usePets } from '../../pets/hooks/usePets'
import common from '../../../styles/featurePage.module.css'
import styles from './HealthHistoryPage.module.css'

type Tab = 'alerts' | 'history'

const alerts = [
  { id: 1, type: '생체정보', title: '휴식 중 심박수가 평소보다 높아요', copy: '15분 뒤 안정된 상태에서 다시 측정해 주세요.', time: '오늘 오후 1:20', tone: 'warning' },
  { id: 2, type: '건강 문진', title: '수분 섭취 변화가 기록됐어요', copy: '내일까지 변화가 이어지는지 관찰해 주세요.', time: '오늘 오전 9:32', tone: 'notice' },
  { id: 3, type: '리포트', title: '새로운 주간 리포트가 도착했어요', copy: '지난주보다 활동 점수가 8점 올랐어요.', time: '8월 4일', tone: 'normal' },
]

const history = [
  { id: 'demo-result', date: '2026.08.05', title: '수분 섭취·활동량 변화', grade: '관찰', score: '23%', description: '급한 이상 신호는 낮지만 수분 섭취 관찰이 필요해요.' },
  { id: 'result-0801', date: '2026.08.01', title: '정기 건강 문진', grade: '정상', score: '8%', description: '최근 건강 기록에서 뚜렷한 주의 신호가 발견되지 않았어요.' },
  { id: 'result-0728', date: '2026.07.28', title: '피부 가려움 문진', grade: '관찰', score: '31%', description: '피부 긁기 빈도와 붉은 부위를 3일간 기록하도록 안내했어요.' },
]

export function HealthHistoryPage() {
  const { selectedPet } = usePets()
  const [tab, setTab] = useState<Tab>('alerts')

  return (
    <div className={common.page}>
      <PetSectionNav />
      <header className={common.header}>
        <div>
          <p className={common.eyebrow}>HEALTH TIMELINE</p>
          <h1 className={common.title}>알림과 건강 이력</h1>
          <p className={common.description}>{selectedPet.name}에게 도착한 건강 신호와 문진 결과를 시간순으로 모았어요.</p>
        </div>
        <button className={common.secondaryButton} type="button">모두 읽음 처리</button>
      </header>

      <div className={styles.tabs} role="tablist" aria-label="건강 기록 종류">
        <button className={tab === 'alerts' ? styles.active : ''} onClick={() => setTab('alerts')} role="tab" aria-selected={tab === 'alerts'} type="button">알림 <span>3</span></button>
        <button className={tab === 'history' ? styles.active : ''} onClick={() => setTab('history')} role="tab" aria-selected={tab === 'history'} type="button">과거 예측 이력</button>
      </div>

      {tab === 'alerts' ? (
        <section className={styles.timeline} aria-label="최근 알림">
          {alerts.map((alert, index) => (
            <article className={`${styles.alertCard} ${styles[alert.tone]}`} key={alert.id}>
              <div className={styles.alertMarker}><span>{index === 0 ? '!' : '•'}</span></div>
              <div className={styles.alertBody}>
                <div className={styles.alertMeta}><span>{alert.type}</span><time>{alert.time}</time></div>
                <h2>{alert.title}</h2>
                <p>{alert.copy}</p>
              </div>
              <button type="button" aria-label={`${alert.title} 알림 더보기`}>•••</button>
            </article>
          ))}
        </section>
      ) : (
        <section className={styles.historyList} aria-label="과거 예측 이력">
          {history.map((item) => (
            <article className={styles.historyCard} key={item.id}>
              <time>{item.date}</time>
              <div>
                <span className={item.grade === '정상' ? styles.normalGrade : styles.watchGrade}>{item.grade}</span>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </div>
              <div className={styles.historyScore}><strong>{item.score}</strong><Link to={`/predictions/${item.id}`}>결과 보기 →</Link></div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
