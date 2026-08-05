import { Link } from 'react-router-dom'
import { PetSectionNav } from '../../pets/components/PetSectionNav'
import { usePets } from '../../pets/hooks/usePets'
import common from '../../../styles/featurePage.module.css'
import styles from './PredictionResultPage.module.css'

const factors = [
  { label: '수분 섭취 변화', value: 42 },
  { label: '활동량 감소', value: 31 },
  { label: '피부 증상', value: 17 },
  { label: '기타 응답', value: 10 },
]

export function PredictionResultPage() {
  const { selectedPet } = usePets()
  const petBase = `/pets/${selectedPet.id}`

  return (
    <div className={common.page}>
      <PetSectionNav />

      <header className={common.header}>
        <div>
          <p className={common.eyebrow}>AI HEALTH CHECK RESULT</p>
          <h1 className={common.title}>{selectedPet.name}의 분석 결과</h1>
          <p className={common.description}>
            오늘 입력한 건강 문진과 최근 생체정보를 함께 살펴봤어요.
          </p>
        </div>
        <span className={common.mockBadge}>화면용 예시 결과</span>
      </header>

      <section className={styles.resultHero} aria-label="AI 예측 요약">
        <div className={styles.riskGauge} aria-label="주의 신호 가능성 23퍼센트">
          <div className={styles.riskGaugeInner}>
            <strong>23%</strong>
            <span>주의 신호 가능성</span>
          </div>
        </div>
        <div className={styles.resultCopy}>
          <span className={styles.watchBadge}>관찰이 필요해요</span>
          <h2>급한 이상 신호는 낮지만,<br />수분 섭취를 지켜봐 주세요.</h2>
          <p>
            평소보다 물을 적게 마시고 활동량도 조금 줄었다고 답했어요.
            오늘과 내일 같은 변화가 이어지는지 기록해 주세요.
          </p>
          <div className={styles.metadata}>
            <span>분석 시각 <strong>2026.08.05 14:32</strong></span>
            <span>모델 버전 <strong>demo-1.0</strong></span>
          </div>
        </div>
      </section>

      <div className={styles.resultGrid}>
        <section className={`${common.panel} ${styles.factorPanel}`}>
          <h2 className={common.sectionTitle}>결과에 영향을 준 항목</h2>
          <p>문진 응답에서 상대적으로 영향이 컸던 항목이에요.</p>
          <div className={styles.factorList}>
            {factors.map((factor) => (
              <div className={styles.factor} key={factor.label}>
                <div><span>{factor.label}</span><strong>{factor.value}%</strong></div>
                <div className={styles.factorTrack}><span style={{ width: `${factor.value}%` }} /></div>
              </div>
            ))}
          </div>
        </section>

        <section className={`${common.panel} ${styles.guidePanel}`}>
          <h2 className={common.sectionTitle}>오늘의 관리 가이드</h2>
          <ol>
            <li><span>01</span><div><strong>신선한 물 준비하기</strong><p>평소 마시던 위치에 깨끗한 물을 넉넉히 놓아 주세요.</p></div></li>
            <li><span>02</span><div><strong>가벼운 활동 확인하기</strong><p>무리하지 않는 범위에서 반응과 걸음걸이를 살펴봐 주세요.</p></div></li>
            <li><span>03</span><div><strong>48시간 이내 다시 기록하기</strong><p>같은 증상이 이어지거나 악화되면 동물병원에 문의하세요.</p></div></li>
          </ol>
        </section>
      </div>

      <aside className={styles.disclaimer}>
        <strong>꼭 확인해 주세요</strong>
        <p>이 결과는 질병을 진단하지 않습니다. 호흡 곤란, 의식 저하, 반복되는 구토 등 응급 증상이 있으면 결과와 관계없이 즉시 동물병원을 방문하세요.</p>
      </aside>

      <div className={styles.actions}>
        <Link className={common.secondaryButton} to={`${petBase}/history`}>지난 결과 보기</Link>
        <Link className={common.primaryButton} to={`${petBase}/questionnaire`}>문진 다시 하기</Link>
      </div>
    </div>
  )
}
