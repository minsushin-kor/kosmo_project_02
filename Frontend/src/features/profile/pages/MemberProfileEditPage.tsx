import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DataState } from '../../../components/common/DataState'
import { LoadingButton } from '../../../components/common/LoadingButton'
import { getApiErrorMessage } from '../../../shared/api/apiClient'
import { useAuth } from '../../auth/hooks/useAuth'
import shared from '../../../styles/featurePage.module.css'
import styles from './MyPage.module.css'

export function MemberProfileEditPage() {
  const { currentUser, updateProfile } = useAuth()
  const navigate = useNavigate()
  const detailAddressRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [address, setAddress] = useState('')
  const [detailAddress, setDetailAddress] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    setName(currentUser.name)
    setEmail(currentUser.email)
    setPhone(currentUser.phone)
    setPostalCode(currentUser.postalCode ?? '')
    setAddress(currentUser.address ?? '')
    setDetailAddress(currentUser.detailAddress ?? '')
  }, [currentUser])

  if (!currentUser) {
    return (
      <div className={shared.page}>
        <DataState title="회원정보를 확인할 수 없습니다." action={<Link to="/login">로그인하기</Link>} />
      </div>
    )
  }

  const showMessage = (text: string, error = false) => {
    setMessage(text)
    setIsError(error)
  }

  const handleOpenPostcode = () => {
    showMessage('')
    if (!window.kakao?.Postcode) {
      showMessage('우편번호 검색 서비스를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.', true)
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSaving) return

    const wantsPasswordChange = Boolean(currentPassword || newPassword || newPasswordConfirm)
    if (wantsPasswordChange && (!currentPassword || !newPassword)) {
      showMessage('비밀번호를 변경하려면 현재 비밀번호와 새 비밀번호를 모두 입력해 주세요.', true)
      return
    }
    if (newPassword && newPassword.length < 8) {
      showMessage('새 비밀번호는 8자 이상 입력해 주세요.', true)
      return
    }
    if (newPassword !== newPasswordConfirm) {
      showMessage('새 비밀번호가 서로 일치하지 않습니다.', true)
      return
    }

    setIsSaving(true)
    showMessage('')
    try {
      await updateProfile({
        userName: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        currentPassword: wantsPasswordChange ? currentPassword : null,
        newPassword: wantsPasswordChange ? newPassword : null,
        postalCode,
        address,
        detailAddress: detailAddress.trim(),
      })
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordConfirm('')
      navigate('/', { replace: true })
    } catch (error) {
      showMessage(getApiErrorMessage(error, '회원정보를 변경하지 못했습니다.'), true)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <div>
          <p className={shared.eyebrow}>MEMBER PROFILE</p>
          <h1 className={shared.title}>회원정보 수정</h1>
          <p className={shared.description}>보호자 기본정보와 로그인 비밀번호를 변경합니다.</p>
        </div>
        <Link className={styles.backLink} to="/mypage">마이페이지 목록</Link>
      </header>

      <form className={`${shared.panel} ${styles.profileForm}`} onSubmit={handleSubmit}>
        <section className={styles.formSection} aria-labelledby="basic-profile-heading">
          <div className={styles.sectionHeading}>
            <span aria-hidden="true">01</span>
            <div><h2 id="basic-profile-heading">기본 회원정보</h2><p>아이디를 제외한 회원정보를 변경할 수 있습니다.</p></div>
          </div>
          <div className={styles.fieldGrid}>
            <label><span>이름</span><input value={name} onChange={(event) => setName(event.target.value)} required maxLength={50} autoComplete="name" /></label>
            <label><span>아이디</span><input value={currentUser.username} readOnly /></label>
            <label><span>이메일</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={100} autoComplete="email" /></label>
            <label><span>연락처</span><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={20} autoComplete="tel" placeholder="010-1234-5678" /></label>
          </div>
        </section>

        <section className={styles.formSection} aria-labelledby="address-heading">
          <div className={styles.sectionHeading}>
            <span aria-hidden="true">02</span>
            <div><h2 id="address-heading">주소</h2><p>변경한 주소는 회원 계정에 저장됩니다.</p></div>
          </div>
          <div className={styles.fieldGrid}>
            <label>
              <span>우편번호</span>
              <div className={styles.postcodeField}>
                <input value={postalCode} readOnly autoComplete="postal-code" placeholder="우편번호 찾기를 이용해 주세요" />
                <button type="button" onClick={handleOpenPostcode}>우편번호 찾기</button>
              </div>
            </label>
            <label className={styles.wideField}><span>기본 주소</span><input value={address} readOnly autoComplete="address-line1" placeholder="주소 검색 후 자동으로 입력됩니다" /></label>
            <label className={styles.wideField}><span>상세 주소</span><input ref={detailAddressRef} value={detailAddress} onChange={(event) => setDetailAddress(event.target.value)} maxLength={100} autoComplete="address-line2" placeholder="동·호수 등 상세 주소를 입력해 주세요" /></label>
          </div>
        </section>

        <section className={styles.formSection} aria-labelledby="password-heading">
          <div className={styles.sectionHeading}>
            <span aria-hidden="true">03</span>
            <div><h2 id="password-heading">비밀번호 변경</h2><p>변경하지 않으려면 아래 항목을 비워 두세요.</p></div>
          </div>
          <div className={styles.fieldGrid}>
            <label className={styles.wideField}><span>현재 비밀번호</span><input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" /></label>
            <label><span>새 비밀번호</span><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} autoComplete="new-password" placeholder="8자 이상 입력" /></label>
            <label><span>새 비밀번호 확인</span><input type="password" value={newPasswordConfirm} onChange={(event) => setNewPasswordConfirm(event.target.value)} minLength={8} autoComplete="new-password" /></label>
          </div>
        </section>

        {message && <p className={`${styles.formMessage} ${isError ? styles.errorMessage : ''}`} role={isError ? 'alert' : 'status'}>{message}</p>}
        <div className={styles.formActions}>
          <Link to="/mypage">취소</Link>
          <LoadingButton type="submit" isLoading={isSaving}>변경사항 저장</LoadingButton>
        </div>
      </form>
    </div>
  )
}
