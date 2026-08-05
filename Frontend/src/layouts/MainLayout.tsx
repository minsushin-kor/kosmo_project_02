import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { BrandMark } from '../components/common/BrandMark'
import styles from './MainLayout.module.css'

export function MainLayout() {
  const { hash, pathname } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      const sectionId = decodeURIComponent(hash.slice(1))
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [hash, pathname])

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brandLink} to="/" aria-label="PetPulse 홈">
            <BrandMark />
          </Link>

          <nav className={styles.navigation} aria-label="주요 메뉴">
            <Link to="/#services">서비스 소개</Link>
            <Link to="/#how-it-works">이용 방법</Link>
            <NavLink
              to="/pets"
              className={({ isActive }) => (isActive ? styles.active : undefined)}
            >
              반려동물
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => (isActive ? styles.active : undefined)}
            >
              건강 대시보드
            </NavLink>
            <NavLink
              to="/mypage"
              className={({ isActive }) => (isActive ? styles.active : undefined)}
            >
              마이페이지
            </NavLink>
          </nav>

          <div className={styles.headerActions}>
            <Link className={styles.signupCta} to="/signup">
              회원가입
            </Link>
            <Link className={styles.headerCta} to="/login">
              로그인
            </Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <BrandMark inverse />
          <p>
            PetPulse의 분석 결과는 건강관리를 위한 참고 정보이며,
            수의사의 진단을 대신하지 않습니다.
          </p>
          <small>© 2026 PetPulse. All rights reserved.</small>
        </div>
      </footer>
    </div>
  )
}
