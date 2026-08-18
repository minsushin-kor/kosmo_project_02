import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandMark } from '../../../components/common/BrandMark'
import { LoadingButton } from '../../../components/common/LoadingButton'
import { TextField } from '../../../components/common/TextField'
import { useAuth } from '../hooks/useAuth'
import styles from './AuthPages.module.css'

export function SignupPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
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

    const phone = [data.get('phonePrefix'), data.get('phoneMiddle'), data.get('phoneLast')]
      .map(String)
      .join('-')
    const result = register({
      name: String(data.get('name')),
      username: String(data.get('username')),
      email: String(data.get('email')),
      phone,
      postalCode: String(data.get('postalCode')),
      address: String(data.get('address')),
      detailAddress: String(data.get('detailAddress')),
      password: String(data.get('password')),
    })

    if (!result.success) {
      setError(result.message ?? '회원가입 정보를 저장하지 못했습니다.')
      return
    }

    navigate('/login', {
      replace: true,
      state: { signedUp: true, username: String(data.get('username')) },
    })
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
            <TextField containerClassName={styles.field} label="이름" name="name" type="text" required maxLength={30} autoComplete="name" placeholder="보호자 이름" />
            <TextField containerClassName={styles.field} label="아이디" name="username" type="text" required autoComplete="username" placeholder="사용할 아이디를 입력해 주세요" />
            <TextField containerClassName={styles.field} label="이메일" name="email" type="email" required autoComplete="email" placeholder="name@example.com" />
            <label className={styles.field}>
              <span>전화번호</span>
              <div className={styles.phoneField}>
                <select name="phonePrefix" required aria-label="전화번호 앞자리" defaultValue="010">
                  <option value="010">010</option>
                  <option value="011">011</option>
                  <option value="016">016</option>
                  <option value="017">017</option>
                  <option value="018">018</option>
                  <option value="019">019</option>
                </select>
                <input
                  name="phoneMiddle"
                  type="tel"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{3,4}"
                  minLength={3}
                  maxLength={4}
                  aria-label="전화번호 가운데 자리"
                  placeholder="1234"
                />
                <input
                  name="phoneLast"
                  type="tel"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  minLength={4}
                  maxLength={4}
                  aria-label="전화번호 마지막 자리"
                  placeholder="5678"
                />
              </div>
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
            <TextField
              containerClassName={styles.field}
              label="기본 주소"
              className={styles.readOnlyField}
              name="address"
              type="text"
              required
              readOnly
              autoComplete="address-line1"
              value={address}
              placeholder="주소 검색 후 자동으로 입력됩니다"
            />
            <TextField
              ref={detailAddressRef}
              containerClassName={styles.field}
              label="상세 주소"
              name="detailAddress"
              type="text"
              required
              autoComplete="address-line2"
              value={detailAddress}
              onChange={(event) => setDetailAddress(event.target.value)}
              placeholder="동·호수 등 상세 주소를 입력해 주세요"
            />
            <TextField containerClassName={styles.field} label="비밀번호" name="password" type="password" required autoComplete="new-password" placeholder="비밀번호를 입력해 주세요" />
            <TextField containerClassName={styles.field} label="비밀번호 확인" name="passwordConfirm" type="password" required autoComplete="new-password" placeholder="비밀번호를 다시 입력해 주세요" />
            {error && <div className={styles.errorMessage} role="alert">{error}</div>}
            <LoadingButton className={styles.submitButton} type="submit">회원가입</LoadingButton>
          </form>

          <p className={styles.switchText}>이미 계정이 있나요? <Link to="/login">로그인</Link></p>
        </div>
      </section>
    </div>
  )
}
