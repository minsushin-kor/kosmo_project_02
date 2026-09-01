import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage, getApiResourceUrl, isAbortError } from '../../../shared/api/apiClient'
import { getPetEmoji, speciesLabel } from '../../pets/types'
import { getPublicLostPetProfile } from '../api/lostPetQrApi'
import type { PublicLostPetProfile } from '../types'
import styles from './PublicLostPetPage.module.css'

const PUBLIC_PROFILE_TIMEOUT_MS = 8_000

function withObjectParticle(name: string) {
  const lastCharacter = name.at(-1)
  if (!lastCharacter) return name
  const code = lastCharacter.charCodeAt(0)
  const hasFinalConsonant = code >= 0xac00 && code <= 0xd7a3
    ? (code - 0xac00) % 28 !== 0
    : false
  return `${name}${hasFinalConsonant ? '을' : '를'}`
}

export function PublicLostPetPage() {
  const { publicToken = '' } = useParams()
  const [profile, setProfile] = useState<PublicLostPetProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isPhotoUnavailable, setIsPhotoUnavailable] = useState(false)

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
    setIsPhotoUnavailable(false)

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
  const petType = profile.species
    ? [speciesLabel[profile.species], profile.breed?.trim()].filter(Boolean).join(' · ')
    : ''
  const publicPhotoUrl = getApiResourceUrl(
    `/api/public/lost-pets/${encodeURIComponent(publicToken)}/photo`,
  )

  return (
    <main className={styles.page}>
      <article className={styles.profileCard}>
        <div className={styles.photoHero}>
          {!isPhotoUnavailable && (
            <img
              src={publicPhotoUrl}
              alt={`${profile.petName} 사진`}
              onError={() => setIsPhotoUnavailable(true)}
            />
          )}
          {isPhotoUnavailable && (
            <span aria-hidden="true">{profile.species ? getPetEmoji(profile.species) : '🐾'}</span>
          )}
        </div>

        <section className={styles.details} aria-label="반려동물과 보호자 공개 정보">
          <div className={styles.contactPrompt}>
            <h1>{withObjectParticle(profile.petName)} 발견하셨나요?</h1>
            <p>아래 연락처로 연락해 주세요.</p>
          </div>

          <dl>
            <div><dt>이름</dt><dd>{profile.petName}</dd></div>
            {petType && <div><dt>종류·품종</dt><dd>{petType}</dd></div>}
            {profile.guardianName && <div><dt>보호자</dt><dd>{profile.guardianName}</dd></div>}
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
