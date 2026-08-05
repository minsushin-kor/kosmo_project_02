import { useState } from 'react'
import { PetSectionNav } from '../../pets/components/PetSectionNav'
import { usePets } from '../../pets/hooks/usePets'
import shared from '../../../styles/featurePage.module.css'
import styles from './VitalMonitoringPage.module.css'

const measurements = [
  { time: '오늘 08:30', temperature: '38.4°C', heartRate: '92 bpm', respiratoryRate: '24회/분', status: '정상' },
  { time: '어제 20:10', temperature: '38.6°C', heartRate: '96 bpm', respiratoryRate: '25회/분', status: '정상' },
  { time: '어제 08:25', temperature: '38.5°C', heartRate: '94 bpm', respiratoryRate: '24회/분', status: '정상' },
  { time: '08.03 20:05', temperature: '38.8°C', heartRate: '101 bpm', respiratoryRate: '28회/분', status: '관찰' },
]

export function VitalMonitoringPage() {
  const { selectedPet } = usePets()
  const [period, setPeriod] = useState('7일')

  return (
    <>
      <PetSectionNav />
      <div className={shared.page}>
        <header className={shared.header}>
          <div><p className={shared.eyebrow}>VITAL MONITORING</p><h1 className={shared.title}>생체정보 모니터링</h1><p className={shared.description}>{selectedPet.name}의 체온·심박수·호흡수 변화를 시간순으로 확인합니다.</p></div>
          <span className={shared.mockBadge}>최근 측정 08:30</span>
        </header>

        <section className={shared.gridThree} aria-label="최신 생체정보">
          <article className={styles.vitalCard}><div><span aria-hidden="true">♨</span><p>체온</p><small>정상 범위</small></div><strong>38.4<em>°C</em></strong><p>이전 측정 대비 -0.2°C</p></article>
          <article className={styles.vitalCard}><div><span aria-hidden="true">♥</span><p>심박수</p><small>안정적</small></div><strong>92<em>bpm</em></strong><p>이전 측정 대비 -4 bpm</p></article>
          <article className={styles.vitalCard}><div><span aria-hidden="true">⌁</span><p>호흡수</p><small>정상 범위</small></div><strong>24<em>회/분</em></strong><p>이전 측정 대비 -1회</p></article>
        </section>

        <section className={`${shared.panel} ${styles.chartPanel}`}>
          <div className={styles.panelHeader}>
            <div><p>VITAL TREND</p><h2>최근 측정 흐름</h2></div>
            <div className={styles.periodButtons} aria-label="조회 기간">
              {['24시간', '7일', '30일'].map((item) => <button type="button" className={period === item ? styles.active : ''} onClick={() => setPeriod(item)} key={item}>{item}</button>)}
            </div>
          </div>
          <div className={styles.legend}><span><i className={styles.temperature} />체온</span><span><i className={styles.heart} />심박수</span><span><i className={styles.breath} />호흡수</span></div>
          <div className={styles.chart} role="img" aria-label={`${period} 동안의 생체정보 변화 그래프`}>
            <div className={styles.gridLines}>{[0, 1, 2, 3].map((line) => <span key={line} />)}</div>
            <svg viewBox="0 0 800 220" preserveAspectRatio="none" aria-hidden="true">
              <polyline className={styles.temperatureLine} points="0,130 115,118 230,126 345,94 460,105 575,90 690,98 800,84" />
              <polyline className={styles.heartLine} points="0,165 115,140 230,150 345,112 460,130 575,100 690,116 800,104" />
              <polyline className={styles.breathLine} points="0,190 115,180 230,184 345,160 460,170 575,145 690,155 800,148" />
            </svg>
            <div className={styles.xAxis}>{['월', '화', '수', '목', '금', '토', '일', '오늘'].map((day) => <span key={day}>{day}</span>)}</div>
          </div>
        </section>

        <section className={`${shared.panel} ${styles.historyPanel}`}>
          <div className={styles.panelHeader}><div><p>RECENT RECORDS</p><h2>최근 측정 기록</h2></div><button type="button">CSV 내보내기</button></div>
          <div className={styles.tableWrap}>
            <table><thead><tr><th>측정 시각</th><th>체온</th><th>심박수</th><th>호흡수</th><th>상태</th></tr></thead><tbody>{measurements.map((row) => <tr key={row.time}><td>{row.time}</td><td>{row.temperature}</td><td>{row.heartRate}</td><td>{row.respiratoryRate}</td><td><span className={row.status === '정상' ? styles.normal : styles.watch}>{row.status}</span></td></tr>)}</tbody></table>
          </div>
        </section>
      </div>
    </>
  )
}
