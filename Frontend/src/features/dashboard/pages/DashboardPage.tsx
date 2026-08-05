import styles from './DashboardPage.module.css'

const vitals = [
  { label: '체온', value: '38.4', unit: '°C', note: '평소 범위예요', icon: '♨' },
  { label: '심박수', value: '92', unit: 'bpm', note: '안정적으로 보여요', icon: '♥' },
  { label: '호흡수', value: '24', unit: '회/분', note: '최근 측정 기준', icon: '⌁' },
]

const weeklyData = [48, 56, 53, 68, 72, 64, 78]

export function DashboardPage() {
  return (
    <div className={styles.page}>
      <section className={styles.welcome}>
        <div>
          <p className={styles.eyebrow}>TODAY'S PET WELLNESS</p>
          <h1>안녕하세요, 보호자님.</h1>
          <p>코코의 오늘 건강 신호를 차분하게 살펴볼까요?</p>
        </div>
        <button className={styles.petSelector} type="button" aria-label="반려동물 선택">
          <span className={styles.petAvatar} aria-hidden="true">🐶</span>
          <span><strong>코코</strong><small>웰시코기 · 4살</small></span>
          <span aria-hidden="true">⌄</span>
        </button>
      </section>

      <section className={styles.summaryGrid} aria-label="건강 상태 요약">
        <article className={styles.overallCard}>
          <div className={styles.cardHeading}>
            <div>
              <p>오늘의 건강 신호</p>
              <h2>전반적으로 안정적이에요</h2>
            </div>
            <span className={styles.normalBadge}>정상</span>
          </div>
          <div className={styles.scoreArea}>
            <div className={styles.scoreRing} aria-label="건강 점수 86점">
              <strong>86</strong>
              <small>/ 100</small>
            </div>
            <p>
              지난 7일 동안 큰 변화가 없었어요. 오늘도 식욕과 활동량을
              간단히 기록해 주세요.
            </p>
          </div>
          <button className={styles.darkButton} type="button">오늘 건강 문진 시작하기</button>
        </article>

        <article className={styles.noticeCard}>
          <span className={styles.noticeIcon} aria-hidden="true">✦</span>
          <div>
            <p>다음 건강 체크</p>
            <h2>오늘 오후 8:00</h2>
            <small>최근 문진 이후 23시간이 지났어요.</small>
          </div>
          <button type="button">알림 설정</button>
        </article>
      </section>

      <section className={styles.vitalsSection}>
        <div className={styles.sectionTitle}>
          <div>
            <p>LIVE HEALTH SIGNALS</p>
            <h2>최근 생체정보</h2>
          </div>
          <button type="button">전체 기록 보기 <span aria-hidden="true">→</span></button>
        </div>

        <div className={styles.vitalGrid}>
          {vitals.map((vital) => (
            <article className={styles.vitalCard} key={vital.label}>
              <div className={styles.vitalTop}>
                <span aria-hidden="true">{vital.icon}</span>
                <p>{vital.label}</p>
                <small>정상</small>
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
            <button type="button">최근 7일 ⌄</button>
          </div>
          <div className={styles.chart} aria-label="최근 7일 활동량 막대그래프">
            {weeklyData.map((value, index) => (
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
          <h2>이번 주는 활동량이<br />조금씩 좋아지고 있어요.</h2>
          <p>
            평소보다 수분 섭취량이 조금 적었어요. 산책 후 물을 충분히
            마시는지 살펴봐 주세요.
          </p>
          <button type="button">주간 리포트 확인하기 <span aria-hidden="true">→</span></button>
        </article>
      </section>
    </div>
  )
}
