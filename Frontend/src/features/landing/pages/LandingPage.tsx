import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import heroImage from '../../../assets/images/pet-wellness-hero.webp'
import { LoadingButton } from '../../../components/common/LoadingButton'
import { TextField } from '../../../components/common/TextField'
import { useAuth } from '../../auth/hooks/useAuth'
import styles from './LandingPage.module.css'

export function LandingPage() {
  const navigate = useNavigate()
  const { currentUser, login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const data = new FormData(event.currentTarget)
    const result = login(
      String(data.get('username')),
      String(data.get('password')),
      data.get('remember') === 'on',
    )

    if (!result.success) {
      setError(result.message ?? '로그인하지 못했습니다.')
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className={styles.page}>
      <section className={styles.introPanel} aria-labelledby="home-heading">
        <img
          src={heroImage}
          alt="햇살이 비치는 정원에서 함께 쉬고 있는 강아지와 고양이"
          width="1280"
          height="853"
          decoding="async"
          fetchPriority="high"
        />
        <div className={styles.imageOverlay} aria-hidden="true" />
        <div className={styles.introCopy}>
          <p>SMARTER CARE, EVERY DAY</p>
          <h1 id="home-heading">매일의 작은 변화를,<br />더 일찍 알아보세요.</h1>
          <span>
            생체정보와 건강 문진을 한곳에 모아<br />
            우리 아이의 오늘을 차분하게 살펴봅니다.
          </span>
        </div>
        <div className={styles.careNote}>
          <span aria-hidden="true">●</span>
          <p>건강관리를 위한 참고 서비스이며 의료 진단을 대신하지 않습니다.</p>
        </div>
      </section>

      <section className={styles.loginPanel} id="home-login" aria-labelledby="login-heading">
        <div className={styles.loginWrap}>
          {currentUser ? (
            <div className={styles.signedInCard}>
              <p className={styles.eyebrow}>WELCOME BACK</p>
              <span className={styles.profileMark} aria-hidden="true">{currentUser.name.slice(0, 1)}</span>
              <h2 id="login-heading">{currentUser.name}님,<br />다시 만나 반가워요.</h2>
              <p>등록한 반려동물의 오늘 상태를 확인해 보세요.</p>
              <Link className={styles.primaryButton} to="/dashboard">우리 아이 상태 확인하기</Link>
              <Link className={styles.secondaryLink} to="/mypage">마이페이지로 이동</Link>
            </div>
          ) : (
            <>
              <p className={styles.eyebrow}>MEMBER LOGIN</p>
              <h2 id="login-heading">다시 만나 반가워요.</h2>
              <p className={styles.description}>로그인하고 우리 아이의 오늘 상태를 확인해 보세요.</p>

              <form onSubmit={handleSubmit}>
                <TextField
                  containerClassName={styles.field}
                  label="아이디"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="아이디를 입력해 주세요"
                />
                <div className={styles.field}>
                  <label htmlFor="home-password"><span>비밀번호</span></label>
                  <div className={styles.passwordField}>
                    <input
                      id="home-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      placeholder="비밀번호를 입력해 주세요"
                    />
                    <button type="button" onClick={() => setShowPassword((current) => !current)}>
                      {showPassword ? '숨기기' : '보기'}
                    </button>
                  </div>
                </div>
                <div className={styles.formOptions}>
                  <label><input name="remember" type="checkbox" /> 로그인 유지</label>
                </div>
                {error && <div className={styles.errorMessage} role="alert">{error}</div>}
                <LoadingButton className={styles.submitButton} type="submit">로그인</LoadingButton>
              </form>

              <p className={styles.switchText}>아직 계정이 없나요? <Link to="/signup">회원가입</Link></p>
              <div className={styles.mockNotice}>현재는 화면 시연 단계로 로그인 정보가 이 브라우저에만 저장됩니다.</div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
