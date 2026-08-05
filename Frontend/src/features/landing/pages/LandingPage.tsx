import { Link } from 'react-router-dom'
import heroImage from '../../../assets/images/pet-wellness-hero.png'
import styles from './LandingPage.module.css'

const features = [
  {
    number: '01',
    title: '매일의 생체정보',
    description: '체온·심박수·호흡수의 흐름을 한눈에 살펴보고 작은 변화도 놓치지 않아요.',
  },
  {
    number: '02',
    title: '차근차근 건강 문진',
    description: '복잡하지 않은 단계형 문진으로 오늘의 증상과 생활 상태를 편하게 기록해요.',
  },
  {
    number: '03',
    title: '이해하기 쉬운 위험도',
    description: 'AI 분석 결과를 확률·등급·주요 요인으로 나누어 보호자가 이해하기 쉽게 보여줘요.',
  },
]

const steps = [
  ['반려동물 등록', '아이의 기본 정보와 평소 건강 상태를 등록해요.'],
  ['건강 신호 기록', '생체정보와 문진을 통해 오늘의 상태를 남겨요.'],
  ['변화 확인', '분석 결과와 주간 리포트에서 변화의 흐름을 확인해요.'],
]

export function LandingPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>SMARTER CARE, EVERY DAY</p>
          <h1>
            매일의 작은 변화를,
            <span> 더 일찍 알아보세요.</span>
          </h1>
          <p className={styles.heroDescription}>
            생체정보와 건강 문진을 하나로 모아 반려동물의 이상 징후를
            이해하기 쉬운 건강 신호로 전해드려요.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} to="/dashboard">
              건강 대시보드 보기
            </Link>
            <a className={styles.textLink} href="#how-it-works">
              이용 방법 알아보기 <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className={styles.trustNote}>
            <span aria-hidden="true">●</span>
            <p>진단이 아닌, 일상 속 건강 변화 관리를 위한 서비스입니다.</p>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <img
            src={heroImage}
            alt="햇살이 비치는 정원에서 함께 쉬고 있는 강아지와 고양이"
          />
          <div className={styles.imageFrame} aria-hidden="true" />
          <div className={styles.statusCard}>
            <span className={styles.statusIcon} aria-hidden="true">♥</span>
            <div>
              <small>오늘의 건강 신호</small>
              <strong>안정적으로 보여요</strong>
            </div>
            <span className={styles.statusBadge}>정상</span>
          </div>
        </div>
      </section>

      <section className={styles.promise} aria-label="서비스 핵심 가치">
        <p>관찰은 가볍게</p>
        <span aria-hidden="true">✦</span>
        <p>기록은 간편하게</p>
        <span aria-hidden="true">✦</span>
        <p>건강 신호는 명확하게</p>
      </section>

      <section className={styles.section} id="services">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>MEANINGFUL INSIGHTS</p>
          <h2>함께 사는 매일이<br />건강 데이터가 됩니다.</h2>
          <p>
            어렵고 불안한 정보 대신, 보호자가 지금 확인해야 할 내용을
            차분하고 분명하게 정리합니다.
          </p>
        </div>

        <div className={styles.featureGrid}>
          {features.map((feature) => (
            <article className={styles.featureCard} key={feature.number}>
              <span>{feature.number}</span>
              <div className={styles.featureIcon} aria-hidden="true">
                {feature.number === '01' ? '⌁' : feature.number === '02' ? '✓' : '◎'}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.processSection} id="how-it-works">
        <div className={styles.processIntro}>
          <p className={styles.eyebrow}>SIMPLE HEALTH ROUTINE</p>
          <h2>하루 몇 분으로 시작하는<br />우리 아이 건강 루틴</h2>
        </div>
        <ol className={styles.steps}>
          {steps.map(([title, description], index) => (
            <li key={title}>
              <span>0{index + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.finalCta}>
        <p className={styles.eyebrow}>CARE WITH CONFIDENCE</p>
        <h2>말하지 못하는 작은 신호까지<br />꾸준히 살펴볼 수 있도록.</h2>
        <Link className={styles.lightButton} to="/dashboard">
          PetPulse 시작하기
        </Link>
      </section>
    </>
  )
}
