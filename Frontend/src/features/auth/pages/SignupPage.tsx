import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandMark } from '../../../components/common/BrandMark'
import styles from './AuthPages.module.css'

export function SignupPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [address, setAddress] = useState('')
  const [detailAddress, setDetailAddress] = useState('')
  const detailAddressRef = useRef<HTMLInputElement>(null)

  const handleOpenPostcode = () => {
    setError('')

    if (!window.kakao?.Postcode) {
      setError('우편번호 검색 서비스를 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.')
      return
    }

    new window.kakao.Postcode({
      oncomplete: (data) => {
        const selectedAddress = data.userSelectedType === 'R'
          ? data.roadAddress
          : data.jibunAddress

        setPostalCode(data.zonecode)
        setAddress(selectedAddress || data.address)
        window.requestAnimationFrame(() => detailAddressRef.current?.focus())
      },
    }).open()
  }

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
              <span>전화번호</span>
              <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" placeholder="010-0000-0000" />
            </label>
            <label className={styles.field}>
              <span>우편번호</span>
              <div className={styles.postcodeField}>
                <input
                  className={styles.readOnlyField}
                  name="postalCode"
                  type="text"
                  required
                  readOnly
                  autoComplete="postal-code"
                  value={postalCode}
                  placeholder="우편번호 찾기를 이용해 주세요"
                />
                <button type="button" onClick={handleOpenPostcode}>우편번호 찾기</button>
              </div>
            </label>
            <label className={styles.field}>
              <span>기본 주소</span>
              <input
                className={styles.readOnlyField}
                name="address"
                type="text"
                required
                readOnly
                autoComplete="address-line1"
                value={address}
                placeholder="주소 검색 후 자동으로 입력됩니다"
              />
            </label>
            <label className={styles.field}>
              <span>상세 주소</span>
              <input
                ref={detailAddressRef}
                name="detailAddress"
                type="text"
                required
                autoComplete="address-line2"
                value={detailAddress}
                onChange={(event) => setDetailAddress(event.target.value)}
                placeholder="동·호수 등 상세 주소를 입력해 주세요"
              />
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
