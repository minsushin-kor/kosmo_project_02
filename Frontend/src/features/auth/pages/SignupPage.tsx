import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandMark } from '../../../components/common/BrandMark'
import styles from './AuthPages.module.css'

export function SignupPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)

    if (data.get('password') !== data.get('passwordConfirm')) {
      setError('비밀번호가 서로 일치하지 않습니다.')
      return
    }

    navigate('/login', { replace: true, state: { signedUp: true } })
  }

  return (
    <div className={styles.page}>
      <section className={`${styles.visualPanel} ${styles.signupVisual}`}>
        <BrandMark inverse />
        <div>
          <p>START PET WELLNESS</p>
          <h1>함께하는 오늘부터<br />건강한 기록을 시작해요.</h1>
          <span>생체정보와 문진을 한곳에 모아 건강 변화를 꾸준히 확인할 수 있어요.</span>
        </div>
        <small>개인정보는 실제 API 연결 단계에서 암호화하여 처리합니다.</small>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.formWrap}>
          <p className={styles.eyebrow}>CREATE ACCOUNT</p>
          <h2>PetPulse 시작하기</h2>
          <p className={styles.description}>보호자 정보를 입력하고 첫 반려동물을 등록해 보세요.</p>

          <form onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>이름</span>
              <input name="name" type="text" required maxLength={30} autoComplete="name" placeholder="보호자 이름" />
            </label>
            <label className={styles.field}>
              <span>아이디</span>
              <input name="username" type="text" required autoComplete="username" placeholder="사용할 아이디를 입력해 주세요" />
            </label>
            <label className={styles.field}>
              <span>이메일</span>
              <input name="email" type="email" required autoComplete="email" placeholder="name@example.com" />
            </label>
            <label className={styles.field}>
              <span>비밀번호</span>
              <input name="password" type="password" required autoComplete="new-password" placeholder="비밀번호를 입력해 주세요" />
            </label>
            <label className={styles.field}>
              <span>비밀번호 확인</span>
              <input name="passwordConfirm" type="password" required autoComplete="new-password" placeholder="비밀번호를 다시 입력해 주세요" />
            </label>
            {error && <div className={styles.errorMessage} role="alert">{error}</div>}
            <button className={styles.submitButton} type="submit">회원가입</button>
          </form>

          <p className={styles.switchText}>이미 계정이 있나요? <Link to="/login">로그인</Link></p>
        </div>
      </section>
    </div>
  )
}
