import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/common/BrandMark'
import { useAuth } from '../features/auth/hooks/useAuth'
import { ChatAssistant } from '../features/chatbot/components/ChatAssistant'
import { ChatProvider } from '../features/chatbot/context/ChatProvider'
import { usePets } from '../features/pets/hooks/usePets'
import { WalkAdviceTopCard } from '../features/walkAdvice/components/WalkAdviceTopCard'
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
  const isQuickPrediction = pathname === '/quick-prediction'
  const isFoodRecommendation = pathname === '/food-recommendation'
  const hidesFloatingChat = isHome || isQuickPrediction || isFoodRecommendation || pathname === '/login' || pathname === '/signup' || pathname.endsWith('/diary')
  const petRecordBase = selectedPet ? `/pets/${selectedPet.id}` : '/pets'
  const petRecordLinks = [
    { label: '우리 아이 상태', to: '/dashboard' },
    { label: '건강 수치 기록', to: selectedPet ? `${petRecordBase}/vitals` : '/pets' },
    { label: '건강 문진', to: selectedPet ? `${petRecordBase}/questionnaire` : '/pets' },
    { label: '알림·이력', to: selectedPet ? `${petRecordBase}/history` : '/pets' },
    { label: '주간 리포트', to: selectedPet ? `${petRecordBase}/reports` : '/pets' },
    { label: '건강 다이어리', to: selectedPet ? `${petRecordBase}/diary` : '/pets' },
  ]
  const isHealthRecords = isDashboard || /^\/pets\/[^/]+\/(vitals|questionnaire|history|alerts|reports|diary)$/.test(pathname) ||
    pathname.startsWith('/predictions/') || pathname.startsWith('/reports/')
  const isMyPage = pathname.startsWith('/mypage') || pathname === '/pets' || pathname === '/pets/new' ||
    /^\/pets\/[^/]+\/edit$/.test(pathname)
  const [isChatOpen, setIsChatOpen] = useState(() => (
    window.location.pathname === '/dashboard' &&
    shouldAutoOpenDashboardChat()
  ))
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isRecordMenuOpen, setIsRecordMenuOpen] = useState(false)
  const recordMenuCloseTimer = useRef<number | null>(null)

  const cancelRecordMenuClose = () => {
    if (recordMenuCloseTimer.current !== null) {
      window.clearTimeout(recordMenuCloseTimer.current)
      recordMenuCloseTimer.current = null
    }
  }

  const openRecordMenu = () => {
    cancelRecordMenuClose()
    setIsRecordMenuOpen(true)
  }

  const closeRecordMenu = () => {
    cancelRecordMenuClose()
    setIsRecordMenuOpen(false)
  }

  const scheduleRecordMenuClose = () => {
    cancelRecordMenuClose()
    recordMenuCloseTimer.current = window.setTimeout(() => {
      setIsRecordMenuOpen(false)
      recordMenuCloseTimer.current = null
    }, 120)
  }

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
    closeRecordMenu()
  }, [pathname])

  useEffect(() => () => cancelRecordMenuClose(), [])

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
          <Link className={styles.brandLink} to="/" aria-label="PatPet 홈">
            <BrandMark />
          </Link>

          <nav
            className={`${styles.navigation} ${isMobileNavOpen ? styles.mobileNavOpen : ''}`}
            id="primary-navigation"
            aria-label="주요 메뉴"
          >
            <NavLink
              to="/quick-prediction"
              className={({ isActive }) => (isActive ? styles.active : undefined)}
              onClick={() => setIsMobileNavOpen(false)}
            >
              상태 간단 예측
            </NavLink>
            <NavLink
              to="/food-recommendation"
              className={({ isActive }) => (isActive ? styles.active : undefined)}
              onClick={() => setIsMobileNavOpen(false)}
            >
              사료 추천
            </NavLink>
            <div
              className={`${styles.recordMenu} ${isRecordMenuOpen ? styles.recordMenuOpen : ''}`}
              onPointerEnter={openRecordMenu}
              onPointerLeave={scheduleRecordMenuClose}
              onFocus={openRecordMenu}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  scheduleRecordMenuClose()
                }
              }}
            >
              <NavLink
                to="/dashboard"
                className={() => (isHealthRecords ? styles.active : undefined)}
                aria-current={isHealthRecords ? 'page' : undefined}
                aria-expanded={isRecordMenuOpen}
                onClick={() => {
                  setIsMobileNavOpen(false)
                  closeRecordMenu()
                }}
              >
                우리 아이 기록
              </NavLink>
              <div className={styles.recordDropdown} aria-label="우리 아이 기록 하위 메뉴">
                {petRecordLinks.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    onClick={() => {
                      setIsMobileNavOpen(false)
                      closeRecordMenu()
                    }}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
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
                {selectedPet && <WalkAdviceTopCard petId={selectedPet.id} petName={selectedPet.name} />}
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
            PatPet의 분석 결과는 건강관리를 위한 참고 정보이며,
            수의사의 진단을 대신하지 않습니다.
          </p>
          <small>© 2026 PatPet. All rights reserved.</small>
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
