import { Link } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  return (
    <section className={styles.page}>
      <span aria-hidden="true">🐾</span>
      <p>404 · PAGE NOT FOUND</p>
      <h1>길을 잠시 잃었나 봐요.</h1>
      <p>요청한 페이지를 찾을 수 없습니다. 홈으로 돌아가 다시 시작해 주세요.</p>
      <Link to="/">홈으로 돌아가기</Link>
    </section>
  )
}
