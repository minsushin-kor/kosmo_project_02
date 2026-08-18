import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DataState } from '../../../components/common/DataState'
import { PetSectionNav } from '../../pets/components/PetSectionNav'
import { useRoutePet } from '../../pets/hooks/useRoutePet'
import common from '../../../styles/featurePage.module.css'
import styles from './HealthContentsPage.module.css'

type Category = '전체' | '영양' | '활동' | '피부' | '생활'

const contents = [
  { id: 1, category: '영양', title: '반려동물이 물을 충분히 마시게 돕는 5가지 방법', description: '물그릇 위치부터 습식 사료 활용까지 일상에서 실천하기 쉬운 방법을 소개해요.', readTime: '4분', tone: 'sage', icon: '💧' },
  { id: 2, category: '활동', title: '더운 날에도 안전하게 산책하는 시간과 방법', description: '바닥 온도를 확인하고 무리 없는 활동 강도를 정하는 기준을 알아봐요.', readTime: '5분', tone: 'sand', icon: '☀️' },
  { id: 3, category: '피부', title: '자주 긁는 행동, 먼저 기록해야 할 것들', description: '긁는 위치와 빈도, 피부 색 변화를 관찰하는 간단한 기록법이에요.', readTime: '6분', tone: 'peach', icon: '✦' },
  { id: 4, category: '생활', title: '규칙적인 수면 리듬을 만드는 집안 환경', description: '빛과 소리, 잠자리 위치가 반려동물의 휴식에 미치는 영향을 살펴봐요.', readTime: '4분', tone: 'olive', icon: '☾' },
  { id: 5, category: '영양', title: '간식량을 하루 급여량에 맞추는 방법', description: '체중과 활동량을 고려해 과식 없이 보상하는 기준을 정리했어요.', readTime: '7분', tone: 'sand', icon: '○' },
  { id: 6, category: '활동', title: '실내에서도 지루하지 않은 후각 놀이', description: '짧은 시간에도 집중력과 활동을 함께 높이는 놀이를 시작해 보세요.', readTime: '5분', tone: 'sage', icon: '⌁' },
] as const

const categories: Category[] = ['전체', '영양', '활동', '피부', '생활']

export function HealthContentsPage() {
  const { selectedPet, routePetMissing } = useRoutePet()
  const [category, setCategory] = useState<Category>('전체')
  const visibleContents = category === '전체' ? contents : contents.filter((content) => content.category === category)

  if (!selectedPet || routePetMissing) {
    return <div className={common.page}><DataState title="반려동물 정보를 찾을 수 없습니다." action={<Link to="/pets">반려동물 목록으로 이동</Link>} /></div>
  }

  return (
    <div className={common.page}>
      <PetSectionNav />
      <header className={common.header}>
        <div>
          <p className={common.eyebrow}>PET CARE LIBRARY</p>
          <h1 className={common.title}>건강관리 콘텐츠</h1>
          <p className={common.description}>{selectedPet.name}의 일상 건강관리에 도움 되는 정보를 모았어요.</p>
        </div>
      </header>

      <section className={styles.featured}>
        <div className={styles.featuredVisual}><span aria-hidden="true">♧</span></div>
        <div>
          <span className={styles.featuredLabel}>THIS WEEK'S PICK</span>
          <h2>건강 기록은<br />작고 꾸준할수록 좋아요.</h2>
          <p>식사, 물, 활동, 배변 네 가지를 매일 같은 시간에 기록하는 방법부터 시작해 보세요.</p>
          <button className={common.primaryButton} type="button">아티클 읽기</button>
        </div>
      </section>

      <div className={styles.filters} aria-label="콘텐츠 주제 필터">
        {categories.map((item) => <button className={category === item ? styles.active : ''} key={item} onClick={() => setCategory(item)} type="button">{item}</button>)}
      </div>

      <section className={styles.contentGrid} aria-live="polite">
        {visibleContents.map((content) => (
          <article className={styles.contentCard} key={content.id}>
            <div className={`${styles.cardVisual} ${styles[content.tone]}`}><span aria-hidden="true">{content.icon}</span><small>{content.category}</small></div>
            <div className={styles.cardBody}>
              <span>{content.category} · {content.readTime} 읽기</span>
              <h2>{content.title}</h2>
              <p>{content.description}</p>
              <button type="button">자세히 보기 <span aria-hidden="true">→</span></button>
            </div>
          </article>
        ))}
      </section>

      <aside className={styles.notice}>제공되는 콘텐츠는 일반적인 건강관리 정보이며, 개별 증상에 대한 진단이나 처방을 대신하지 않습니다.</aside>
    </div>
  )
}
