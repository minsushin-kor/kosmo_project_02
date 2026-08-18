import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/common/BrandMark'
import { useAuth } from '../features/auth/hooks/useAuth'
import { ChatAssistant } from '../features/chatbot/components/ChatAssistant'
import { ChatProvider } from '../features/chatbot/context/ChatProvider'
import { usePets } from '../features/pets/hooks/usePets'
import styles from './MainLayout.module.css'

const DASHBOARD_CHAT_HIDDEN_KEY = 'petpulse-dashboard-chat-hidden'
const DASHBOARD_CHAT_AUTO_OPEN_QUERY = '(min-width: 1101px)'

function shouldAutoOpenDashboardChat() {
  return window.matchMedia(DASHBOARD_CHAT_AUTO_OPEN_QUERY).matches &&
    window.localStorage.getItem(DASHBOARD_CHAT_HIDDEN_KEY) !== 'true'
}

function MainLayoutContent() {
  const { hash, pathname } = useLocation()
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const { selectedPet } = usePets()
  const isHome = pathname === '/'
  const isDashboard = pathname === '/dashboard'
  const hidesFloatingChat = isHome || pathname === '/login' || pathname === '/signup' || pathname.endsWith('/diary')
  const healthRecordsPath = selectedPet ? `/pets/${selectedPet.id}/vitals` : '/pets'
  const isHealthRecords = /^\/pets\/[^/]+\/(vitals|questionnaire|history|alerts|reports|diary)$/.test(pathname) ||
    pathname.startsWith('/predictions/') || pathname.startsWith('/reports/')
  const isMyPage = pathname === '/mypage' || pathname === '/pets' || pathname === '/pets/new' ||
    /^\/pets\/[^/]+\/edit$/.test(pathname)
  const [isChatOpen, setIsChatOpen] = useState(() => (
    window.location.pathname === '/dashboard' &&
    shouldAutoOpenDashboardChat()
  ))
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

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

  useEffect(() => {
    if (!isDashboard) {
      setIsChatOpen(false)
      return undefined
    }

    const desktopQuery = window.matchMedia(DASHBOARD_CHAT_AUTO_OPEN_QUERY)
    const syncChatWithViewport = () => {
      setIsChatOpen(desktopQuery.matches && window.localStorage.getItem(DASHBOARD_CHAT_HIDDEN_KEY) !== 'true')
    }

    syncChatWithViewport()
    desktopQuery.addEventListener('change', syncChatWithViewport)

    return () => desktopQuery.removeEventListener('change', syncChatWithViewport)
  }, [isDashboard, pathname])

  useEffect(() => {
    setIsMobileNavOpen(false)
  }, [pathname])

  const openChat = () => {
    if (isDashboard) {
      window.localStorage.removeItem(DASHBOARD_CHAT_HIDDEN_KEY)
    }
    setIsChatOpen(true)
  }

  const closeChat = () => {
    if (isDashboard) {
      window.localStorage.setItem(DASHBOARD_CHAT_HIDDEN_KEY, 'true')
    }
    setIsChatOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main-content">본문으로 바로가기</a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brandLink} to="/" aria-label="PetPulse 홈">
            <BrandMark />
          </Link>

          <nav
            className={`${styles.navigation} ${isMobileNavOpen ? styles.mobileNavOpen : ''}`}
            id="primary-navigation"
            aria-label="주요 메뉴"
          >
            <NavLink
              to="/dashboard"
              className={({ isActive }) => (isActive ? styles.active : undefined)}
              onClick={() => setIsMobileNavOpen(false)}
            >
              우리 아이 상태
            </NavLink>
            <NavLink
              to={healthRecordsPath}
              className={() => (isHealthRecords ? styles.active : undefined)}
              aria-current={isHealthRecords ? 'page' : undefined}
              onClick={() => setIsMobileNavOpen(false)}
            >
              우리 아이 기록
            </NavLink>
            <NavLink
              to="/mypage"
              className={() => (isMyPage ? styles.active : undefined)}
              aria-current={isMyPage ? 'page' : undefined}
              onClick={() => setIsMobileNavOpen(false)}
            >
              마이페이지
            </NavLink>
          </nav>

          <div className={styles.headerActions}>
            {currentUser ? (
              <>
                <Link className={styles.userSummary} to="/mypage" aria-label={`${currentUser.name}님의 마이페이지`}>
                  <span aria-hidden="true">{currentUser.name.slice(0, 1)}</span>
                  <span><strong>{currentUser.name}</strong><small>@{currentUser.username}</small></span>
                </Link>
                <button className={styles.logoutButton} type="button" onClick={handleLogout}>로그아웃</button>
              </>
            ) : (
              <>
                <Link className={styles.signupCta} to="/signup">
                  회원가입
                </Link>
                <Link className={styles.headerCta} to="/#home-login">
                  로그인
                </Link>
              </>
            )}
            <button
              className={styles.menuButton}
              type="button"
              aria-expanded={isMobileNavOpen}
              aria-controls="primary-navigation"
              aria-label={isMobileNavOpen ? '주요 메뉴 닫기' : '주요 메뉴 열기'}
              onClick={() => setIsMobileNavOpen((current) => !current)}
            >
              <span aria-hidden="true">{isMobileNavOpen ? '×' : '☰'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main} id="main-content" tabIndex={-1}>
        {isDashboard ? (
          <div className={styles.dashboardFrame}>
            <Outlet />
            <ChatAssistant
              variant="dashboard"
              isOpen={isChatOpen}
              onOpen={openChat}
              onClose={closeChat}
            />
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      {!isDashboard && !hidesFloatingChat && (
        <ChatAssistant
          variant="floating"
          isOpen={isChatOpen}
          onOpen={openChat}
          onClose={closeChat}
        />
      )}

      <footer className={`${styles.footer} ${isHome ? styles.homeFooter : ''}`}>
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

export function MainLayout() {
  return (
    <ChatProvider>
      <MainLayoutContent />
    </ChatProvider>
  )
}
