import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, getApiErrorMessage, isAbortError } from '../../../shared/api/apiClient'
import { useAuth } from '../../auth/hooks/useAuth'
import { PetAvatar } from '../../pets/components/PetAvatar'
import { usePets } from '../../pets/hooks/usePets'
import { getPetEmoji, speciesLabel } from '../../pets/types'
import {
  createLostPetQrProfile,
  getLostPetQrProfile,
  rotateLostPetQrToken,
  updateLostPetQrActive,
} from '../api/lostPetQrApi'
import { QrCodeSvg } from '../components/QrCodeSvg'
import type { LostPetQrProfile } from '../types'
import {
  buildLostPetProfileUrl,
  getLocalPreviewBaseUrl,
} from '../utils/publicProfileUrl'
import { createQrSvgMarkup } from '../utils/qrCodeSvg'
import styles from './LostPetQrManagementPage.module.css'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function LostPetQrManagementPage() {
  const { currentUser } = useAuth()
  const { pets, selectedPet, isLoading: arePetsLoading } = usePets()
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null)
  const [profile, setProfile] = useState<LostPetQrProfile | null>()
  const [hasConsented, setHasConsented] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyAction, setBusyAction] = useState('')

  useEffect(() => {
    if (selectedPetId === null && pets.length > 0) {
      setSelectedPetId(selectedPet?.id ?? pets[0].id)
    }
  }, [pets, selectedPet, selectedPetId])

  const pet = pets.find((candidate) => candidate.id === selectedPetId) ?? null

  useEffect(() => {
    if (!selectedPetId) return

    const controller = new AbortController()
    setProfile(undefined)
    setHasConsented(false)
    setError('')
    setNotice('')

    getLostPetQrProfile(selectedPetId, controller.signal)
      .then(setProfile)
      .catch((loadError: unknown) => {
        if (isAbortError(loadError)) return
        if (loadError instanceof ApiError && loadError.status === 404) {
          setProfile(null)
          return
        }
        setProfile(null)
        setError(getApiErrorMessage(loadError, 'QR 정보를 불러오지 못했습니다.'))
      })

    return () => controller.abort()
  }, [selectedPetId])

  const publicUrl = useMemo(
    () => profile ? buildLostPetProfileUrl(profile.publicToken) : '',
    [profile],
  )
  const previewUrl = useMemo(
    () => profile
      ? buildLostPetProfileUrl(
          profile.publicToken,
          import.meta.env.DEV ? getLocalPreviewBaseUrl() : undefined,
        )
      : '',
    [profile],
  )

  const preview = {
    guardianName: profile?.guardianName ?? currentUser?.name ?? '',
    guardianPhone: profile?.guardianPhone ?? currentUser?.phone ?? '',
    petName: profile?.petName ?? pet?.name ?? '',
    species: profile?.species ?? pet?.species ?? 'DOG',
    medicalHistory: profile?.medicalHistory ?? pet?.medicalHistory ?? '',
  }

  const runAction = async (
    actionName: string,
    action: () => Promise<LostPetQrProfile>,
    successMessage: string,
  ) => {
    setBusyAction(actionName)
    setError('')
    setNotice('')
    try {
      const nextProfile = await action()
      setProfile(nextProfile)
      setNotice(successMessage)
    } catch (actionError) {
      setError(getApiErrorMessage(actionError, 'QR 정보를 변경하지 못했습니다.'))
    } finally {
      setBusyAction('')
    }
  }

  const handleDownload = () => {
    if (!profile || !pet) return
    const blob = new Blob([createQrSvgMarkup(publicUrl)], { type: 'image/svg+xml' })
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = `${pet.name}-실종대비-QR.svg`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
  }

  const handlePrint = () => {
    if (!profile) return
    const printWindow = window.open('', '_blank', 'width=520,height=680')
    if (!printWindow) {
      setError('인쇄 창을 열지 못했습니다. 브라우저의 팝업 차단 설정을 확인해 주세요.')
      return
    }

    printWindow.document.write(`<!doctype html><html lang="ko"><head><title>${escapeHtml(preview.petName)} 실종 대비 QR</title><style>body{margin:0;padding:40px;font-family:sans-serif;text-align:center;color:#303326}svg{width:320px;max-width:100%}h1{margin:20px 0 8px;font-size:24px}p{margin:0;color:#656a59;font-size:14px}@media print{body{padding:0}}</style></head><body>${createQrSvgMarkup(publicUrl)}<h1>${escapeHtml(preview.petName)}를 발견하셨나요?</h1><p>QR을 스캔하면 보호자에게 연락할 수 있습니다.</p><script>window.addEventListener('load',()=>window.print())</script></body></html>`)
    printWindow.document.close()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setNotice('공개 주소를 복사했습니다.')
    } catch {
      setError('주소를 복사하지 못했습니다. 표시된 주소를 직접 선택해 주세요.')
    }
  }

  if (arePetsLoading || (pets.length > 0 && selectedPetId === null)) {
    return <div className={styles.page}><p className={styles.loading}>반려동물 정보를 불러오는 중입니다.</p></div>
  }

  if (pets.length === 0) {
    return (
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>LOST PET QR</p>
          <h1>실종 대비 QR</h1>
          <p>QR을 만들려면 먼저 반려동물을 등록해 주세요.</p>
        </header>
        <Link className={styles.primaryLink} to="/pets/new">반려동물 등록하기</Link>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link to="/mypage">마이페이지</Link><span aria-hidden="true">/</span><strong>실종 대비 QR</strong>
      </div>

      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>LOST PET QR</p>
          <h1>목걸이에 담는<br />안심 연락처</h1>
        </div>
        <p>QR을 발견한 사람이 보호자 연락처와 꼭 필요한 반려동물 정보만 확인할 수 있습니다.</p>
      </header>

      <section className={styles.petChooser} aria-labelledby="qr-pet-heading">
        <div>
          <span>01</span>
          <div><h2 id="qr-pet-heading">반려동물 선택</h2><p>QR을 만들 반려동물을 선택해 주세요.</p></div>
        </div>
        <div className={styles.petButtons}>
          {pets.map((candidate) => (
            <button
              type="button"
              className={candidate.id === selectedPetId ? styles.selectedPet : ''}
              key={candidate.id}
              onClick={() => setSelectedPetId(candidate.id)}
            >
              <PetAvatar pet={candidate} size="small" />
              <span><strong>{candidate.name}</strong><small>{speciesLabel[candidate.species]}</small></span>
            </button>
          ))}
        </div>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.previewCard} aria-labelledby="public-info-heading">
          <div className={styles.sectionHeading}>
            <span>02</span>
            <div><h2 id="public-info-heading">공개 정보 확인</h2><p>DB에 저장된 현재 정보입니다.</p></div>
          </div>

          <div className={styles.publicHero}>
            <div className={styles.petMark} aria-hidden="true">{getPetEmoji(preview.species)}</div>
            <div><small>{speciesLabel[preview.species]}</small><strong>{preview.petName}</strong></div>
          </div>

          <dl className={styles.infoList}>
            <div><dt>보호자 이름</dt><dd>{preview.guardianName || '미등록'}</dd></div>
            <div><dt>보호자 연락처</dt><dd>{preview.guardianPhone || '미등록'}</dd></div>
            <div><dt>반려동물 종류</dt><dd>{speciesLabel[preview.species]}</dd></div>
            <div className={styles.medicalRow}>
              <dt>병력 및 특이사항</dt>
              <dd>{preview.medicalHistory || '등록된 내용이 없습니다.'}</dd>
            </div>
          </dl>

          {!preview.guardianPhone && (
            <p className={styles.phoneWarning}>QR을 만들려면 보호자 연락처가 필요합니다. <Link to="/mypage/profile">회원정보에서 등록하기</Link></p>
          )}

          {!profile && (
            <label className={styles.consentBox}>
              <input
                type="checkbox"
                checked={hasConsented}
                onChange={(event) => setHasConsented(event.target.checked)}
              />
              <span>QR을 활성화하면 위 정보가 링크를 가진 누구에게나 공개된다는 점을 확인했습니다.</span>
            </label>
          )}
        </section>

        <section className={styles.qrCard} aria-labelledby="qr-result-heading">
          <div className={styles.qrCardHeader}>
            <div><p>03</p><h2 id="qr-result-heading">QR 생성 결과</h2></div>
            {profile && <span className={profile.active ? styles.activeBadge : styles.inactiveBadge}>{profile.active ? '공개 중' : '비활성'}</span>}
          </div>

          {profile === undefined ? (
            <p className={styles.loading}>QR 정보를 확인하는 중입니다.</p>
          ) : profile ? (
            <>
              <div className={`${styles.qrFrame} ${profile.active ? '' : styles.disabledQr}`}>
                <QrCodeSvg value={publicUrl} title={`${preview.petName} 실종 대비 QR 코드`} />
                {!profile.active && <span>현재 공개 중지</span>}
              </div>
              <p className={styles.qrCaption}><strong>{preview.petName}를 발견하셨나요?</strong><span>QR을 스캔하면 보호자에게 연락할 수 있습니다.</span></p>
              <div className={styles.urlBox}><span>휴대폰 QR 연결 주소</span><code>{publicUrl}</code></div>

              <div className={styles.mainActions}>
                <button type="button" onClick={handleDownload}>QR 저장</button>
                <button type="button" onClick={handlePrint}>인쇄하기</button>
              </div>
              <div className={styles.subActions}>
                <button type="button" onClick={() => void handleCopy()}>주소 복사</button>
                <a href={previewUrl} target="_blank" rel="noreferrer">
                  {import.meta.env.DEV ? '이 PC에서 미리보기' : '공개 화면 미리보기'}
                </a>
              </div>
              <div className={styles.securityActions}>
                <button
                  type="button"
                  disabled={Boolean(busyAction)}
                  onClick={() => void runAction(
                    'active',
                    () => updateLostPetQrActive(selectedPetId!, !profile.active),
                    profile.active ? 'QR 공개를 중지했습니다.' : 'QR 공개를 다시 시작했습니다.',
                  )}
                >
                  {busyAction === 'active' ? '변경 중...' : profile.active ? '공개 중지' : '다시 활성화'}
                </button>
                <button
                  type="button"
                  disabled={Boolean(busyAction)}
                  onClick={() => {
                    if (window.confirm('새 주소를 발급하면 이전에 저장하거나 인쇄한 QR은 더 이상 작동하지 않습니다. 계속할까요?')) {
                      void runAction('rotate', () => rotateLostPetQrToken(selectedPetId!), '새 QR 주소를 발급했습니다. QR을 다시 저장해 주세요.')
                    }
                  }}
                >
                  {busyAction === 'rotate' ? '재발급 중...' : 'QR 주소 재발급'}
                </button>
              </div>
            </>
          ) : (
            <div className={styles.emptyQr}>
              <div aria-hidden="true">＋</div>
              <strong>아직 생성된 QR이 없습니다.</strong>
              <p>왼쪽의 공개 정보를 확인하고 동의한 뒤 생성해 주세요.</p>
              <button
                type="button"
                disabled={!hasConsented || !preview.guardianPhone || Boolean(busyAction)}
                onClick={() => void runAction(
                  'create',
                  () => createLostPetQrProfile(selectedPetId!),
                  '실종 대비 QR을 생성했습니다.',
                )}
              >
                {busyAction === 'create' ? 'QR 생성 중...' : '실종 대비 QR 생성'}
              </button>
            </div>
          )}

          {notice && <p className={styles.successMessage} role="status">{notice}</p>}
          {error && <p className={styles.errorMessage} role="alert">{error}</p>}
        </section>
      </div>

      <aside className={styles.safetyNotice}>
        <strong>안전하게 사용해 주세요.</strong>
        <p>주소·이메일·회원번호는 공개하지 않습니다. QR을 분실했거나 원치 않는 접근이 의심되면 공개를 중지하거나 주소를 재발급해 주세요.</p>
      </aside>
    </div>
  )
}
