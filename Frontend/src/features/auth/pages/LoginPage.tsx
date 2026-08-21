import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BrandMark } from '../../../components/common/BrandMark'
import { LoadingButton } from '../../../components/common/LoadingButton'
import { TextField } from '../../../components/common/TextField'
import { useAuth } from '../hooks/useAuth'
import styles from './AuthPages.module.css'

type LoginLocationState = {
  signedUp?: boolean
  username?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const state = location.state as LoginLocationState | null
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
      <section className={styles.visualPanel}>
        <BrandMark inverse />
        <div>
          <p>WELCOME BACK</p>
          <h1>오늘도 우리 아이의<br />작은 신호를 살펴봐요.</h1>
          <span>건강 기록은 매일 쌓일수록 더 의미 있는 흐름이 됩니다.</span>
        </div>
        <small>건강관리 참고 서비스 · 의료 진단 대체 불가</small>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.formWrap}>
          <p className={styles.eyebrow}>MEMBER LOGIN</p>
          <h2>다시 만나 반가워요.</h2>
          <p className={styles.description}>등록한 반려동물의 오늘 상태를 확인해 보세요.</p>

          {state?.signedUp && (
            <div className={styles.successMessage} role="status">
              <strong>회원가입이 완료되었습니다.</strong>
              <span>로그인하거나 반려동물 정보를 먼저 등록할 수 있어요.</span>
              <Link className={styles.petRegisterLink} to="/pets/new">
                반려동물이 있으신가요? <b>반려동물 정보 입력하기 →</b>
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              containerClassName={styles.field}
              label="아이디"
              name="username"
              type="text"
              required
              autoComplete="username"
              defaultValue={state?.username ?? ''}
              placeholder="아이디를 입력해 주세요"
            />
            <label className={styles.field}>
              <span>비밀번호</span>
              <div className={styles.passwordField}>
                <input
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
            </label>
            <div className={styles.formOptions}>
              <label><input name="remember" type="checkbox" /> 로그인 유지</label>
            </div>
            {error && <div className={styles.errorMessage} role="alert">{error}</div>}
            <LoadingButton className={styles.submitButton} type="submit">로그인</LoadingButton>
          </form>

          <p className={styles.switchText}>아직 계정이 없나요? <Link to="/signup">회원가입</Link></p>
          <div className={styles.mockNotice}>현재는 화면 시연 단계로 회원정보와 로그인 상태를 이 브라우저에만 저장합니다.</div>
        </div>
      </section>
    </div>
  )
}
