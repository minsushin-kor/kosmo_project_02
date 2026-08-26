import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage, isAbortError } from '../../../shared/api/apiClient'
import { getPetEmoji, speciesLabel } from '../../pets/types'
import { getPublicLostPetProfile } from '../api/lostPetQrApi'
import type { PublicLostPetProfile } from '../types'
import styles from './PublicLostPetPage.module.css'

const PUBLIC_PROFILE_TIMEOUT_MS = 8_000

export function PublicLostPetPage() {
  const { publicToken = '' } = useParams()
  const [profile, setProfile] = useState<PublicLostPetProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const robotsMeta = document.createElement('meta')
    robotsMeta.name = 'robots'
    robotsMeta.content = 'noindex,nofollow,noarchive'
    document.head.appendChild(robotsMeta)

    return () => robotsMeta.remove()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let isMounted = true
    let didTimeout = false
    const timeoutId = window.setTimeout(() => {
      didTimeout = true
      controller.abort()
    }, PUBLIC_PROFILE_TIMEOUT_MS)

    setIsLoading(true)
    setProfile(null)
    setError('')

    getPublicLostPetProfile(publicToken, controller.signal)
      .then(setProfile)
      .catch((loadError: unknown) => {
        if (isAbortError(loadError)) {
          if (didTimeout && isMounted) {
            setError('연결 시간이 오래 걸리고 있습니다. 네트워크 상태를 확인한 뒤 다시 열어 주세요.')
          }
          return
        }
        setError(getApiErrorMessage(loadError, '공개 프로필을 불러오지 못했습니다.'))
      })
      .finally(() => {
        window.clearTimeout(timeoutId)
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [publicToken])

  if (isLoading) {
    return <main className={styles.page}><div className={styles.stateCard} role="status">공개 프로필을 확인하고 있습니다.</div></main>
  }

  if (error || !profile) {
    return (
      <main className={styles.page}>
        <div className={styles.stateCard}>
          <span className={styles.stateIcon} aria-hidden="true">!</span>
          <h1>QR 정보를 확인할 수 없습니다.</h1>
          <p>{error || '공개가 중지되었거나 주소가 변경된 QR입니다.'}</p>
          <Link to="/">PATPET 홈으로 이동</Link>
        </div>
      </main>
    )
  }

  const phoneHref = `tel:${profile.guardianPhone.replace(/[^+\d]/g, '')}`
  const petType = speciesLabel[profile.species]

  return (
    <main className={styles.page}>
      <article className={styles.profileCard}>
        <header className={styles.hero}>
          <p>LOST PET CONTACT</p>
          <div className={styles.petIcon} aria-hidden="true">{getPetEmoji(profile.species)}</div>
          <h1><strong>{profile.petName}</strong>를<br />발견하셨나요?</h1>
          <p>안전한 곳에서 보호하고 계시다면 아래 연락처로 알려주세요.</p>
        </header>

        <section className={styles.details} aria-label="반려동물과 보호자 공개 정보">
          <dl>
            <div><dt>이름</dt><dd>{profile.petName}</dd></div>
            <div><dt>종류</dt><dd>{petType}</dd></div>
            <div><dt>보호자</dt><dd>{profile.guardianName}</dd></div>
            <div><dt>연락처</dt><dd>{profile.guardianPhone}</dd></div>
          </dl>

          {profile.medicalHistory?.trim() && (
            <div className={styles.medicalNotice}>
              <span aria-hidden="true">＋</span>
              <div><strong>병력 및 특이사항</strong><p>{profile.medicalHistory}</p></div>
            </div>
          )}

          <a className={styles.callButton} href={phoneHref}>
            <span aria-hidden="true">☎</span> 보호자에게 전화하기
          </a>
          <p className={styles.privacyCopy}>이 페이지는 보호자가 실종 대비 목적으로 공개한 최소 정보만 표시합니다.</p>
        </section>
      </article>
    </main>
  )
}
