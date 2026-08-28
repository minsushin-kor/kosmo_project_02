import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import heroImage from '../../../assets/images/pet-wellness-hero.webp'
import { LoadingButton } from '../../../components/common/LoadingButton'
import { PawIcon } from '../../../components/common/PawIcon'
import { TextField } from '../../../components/common/TextField'
import { useAuth } from '../../auth/hooks/useAuth'
import { getApiErrorMessage } from '../../../shared/api/apiClient'
import { PetAvatar } from '../../pets/components/PetAvatar'
import { usePets } from '../../pets/hooks/usePets'
import styles from './LandingPage.module.css'

export function LandingPage() {
  const navigate = useNavigate()
  const { currentUser, login } = useAuth()
  const { selectedPet, isLoading: isPetsLoading } = usePets()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return
    setError('')
    setIsSubmitting(true)
    const data = new FormData(event.currentTarget)
    try {
      await login(
        String(data.get('username')),
        String(data.get('password')),
        data.get('remember') === 'on',
      )
      navigate('/dashboard')
    } catch (loginError) {
      setError(getApiErrorMessage(loginError, '로그인하지 못했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
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
          <p id="home-heading">SMART PET CARE, EVERY DAY</p>
        </div>
        <div className={styles.pawTrail} aria-hidden="true">
          <PawIcon />
          <PawIcon />
        </div>
        <div className={styles.careNote}>
          <span aria-hidden="true">●</span>
          <p>건강관리를 위한 참고 서비스이며 의료 진단을 대신하지 않습니다.</p>
        </div>
      </section>

      <section className={styles.loginPanel} id="home-login" aria-label="회원 로그인">
        <div className={styles.loginWrap}>
          {currentUser ? (
            <div className={styles.signedInCard}>
              <span className={styles.profileMark} aria-hidden="true">
                {selectedPet ? <PetAvatar pet={selectedPet} size="medium" /> : '🐾'}
              </span>
              <h2>
                {isPetsLoading
                  ? '반려동물 정보를 불러오고 있어요.'
                  : selectedPet
                    ? `안녕하세요, ${selectedPet.name} 보호자님.`
                    : '안녕하세요, 보호자님.'}
              </h2>
              {selectedPet && (
                <p className={styles.selectedPetNotice}>
                  현재 선택된 반려동물의 건강 정보가 표시됩니다.
                </p>
              )}
              <Link className={styles.primaryButton} to="/dashboard">우리 아이 상태 확인하기</Link>
              <Link className={styles.secondaryLink} to="/mypage">마이페이지로 이동</Link>
            </div>
          ) : (
            <>
              <p className={styles.eyebrow}>MEMBER LOGIN</p>

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
                <LoadingButton className={styles.submitButton} type="submit" isLoading={isSubmitting}>로그인</LoadingButton>
              </form>

              <p className={styles.switchText}>아직 계정이 없나요? <Link to="/signup">회원가입</Link></p>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
