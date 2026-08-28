import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, getApiErrorMessage, isAbortError } from '../../../shared/api/apiClient'
import { useAuth } from '../../auth/hooks/useAuth'
import { PetAvatar } from '../../pets/components/PetAvatar'
import { usePets } from '../../pets/hooks/usePets'
import { getPetEmoji, speciesLabel } from '../../pets/types'
import {
  createLostPetQrProfile,
  deleteLostPetQrProfile,
  getLostPetQrProfile,
  updateLostPetQrActive,
  updateLostPetQrVisibility,
} from '../api/lostPetQrApi'
import { QrCodeSvg } from '../components/QrCodeSvg'
import type {
  LostPetQrProfile,
  LostPetQrVisibility,
} from '../types'
import {
  buildLostPetProfileUrl,
  getLocalPreviewBaseUrl,
} from '../utils/publicProfileUrl'
import { createQrSvgMarkup } from '../utils/qrCodeSvg'
import styles from './LostPetQrManagementPage.module.css'

const DEFAULT_VISIBILITY: LostPetQrVisibility = {
  showGuardianName: true,
  showPetDetails: true,
  showMedicalHistory: true,
}

function getVisibility(profile: LostPetQrProfile): LostPetQrVisibility {
  return {
    showGuardianName: profile.showGuardianName,
    showPetDetails: profile.showPetDetails,
    showMedicalHistory: profile.showMedicalHistory,
  }
}

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
  const [visibility, setVisibility] = useState<LostPetQrVisibility>(DEFAULT_VISIBILITY)
  const [visibilityDraft, setVisibilityDraft] = useState<LostPetQrVisibility>(DEFAULT_VISIBILITY)
  const [isEditingVisibility, setIsEditingVisibility] = useState(false)
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
    setVisibility(DEFAULT_VISIBILITY)
    setVisibilityDraft(DEFAULT_VISIBILITY)
    setIsEditingVisibility(false)
    setHasConsented(false)
    setError('')
    setNotice('')

    getLostPetQrProfile(selectedPetId, controller.signal)
      .then((nextProfile) => {
        setProfile(nextProfile)
        setVisibility(getVisibility(nextProfile))
      })
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

  const publicInfo = {
    guardianName: profile?.guardianName ?? currentUser?.name ?? '',
    guardianPhone: profile?.guardianPhone ?? currentUser?.phone ?? '',
    petName: profile?.petName ?? pet?.name ?? '',
    species: profile?.species ?? pet?.species ?? 'DOG',
    breed: profile?.breed ?? (pet?.breed === '품종 미등록' ? '' : pet?.breed) ?? '',
    medicalHistory: profile?.medicalHistory ?? pet?.medicalHistory ?? '',
  }

  const petDetails = [speciesLabel[publicInfo.species], publicInfo.breed?.trim()]
    .filter(Boolean)
    .join(' · ')

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
      setVisibility(getVisibility(nextProfile))
      setNotice(successMessage)
    } catch (actionError) {
      setError(getApiErrorMessage(actionError, 'QR 정보를 변경하지 못했습니다.'))
    } finally {
      setBusyAction('')
    }
  }

  const handleStartEditing = () => {
    setVisibilityDraft(visibility)
    setIsEditingVisibility(true)
    setError('')
    setNotice('')
  }

  const handleSaveVisibility = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedPetId || busyAction) return

    setBusyAction('save')
    setError('')
    setNotice('')
    try {
      if (profile) {
        const nextProfile = await updateLostPetQrVisibility(selectedPetId, visibilityDraft)
        setProfile(nextProfile)
        setVisibility(getVisibility(nextProfile))
        setNotice('기존 QR의 공개 범위를 저장했습니다.')
      } else {
        setVisibility(visibilityDraft)
        setNotice('선택한 공개 범위는 QR을 생성할 때 적용됩니다.')
      }
      setIsEditingVisibility(false)
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, 'QR 공개 범위를 저장하지 못했습니다.'))
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

    printWindow.document.write(`<!doctype html><html lang="ko"><head><title>${escapeHtml(publicInfo.petName)} 실종 대비 QR</title><style>body{margin:0;padding:40px;font-family:sans-serif;text-align:center;color:#303326}svg{width:320px;max-width:100%}h1{margin:20px 0 8px;font-size:24px}p{margin:0;color:#656a59;font-size:14px}@media print{body{padding:0}}</style></head><body>${createQrSvgMarkup(publicUrl)}<h1>${escapeHtml(publicInfo.petName)}를 발견하셨나요?</h1><p>QR을 스캔하면 보호자에게 연락할 수 있습니다.</p><script>window.addEventListener('load',()=>window.print())</script></body></html>`)
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

  const handleDelete = async () => {
    if (!selectedPetId || !profile || busyAction) return
    if (!window.confirm('QR을 삭제하면 이미 저장하거나 인쇄한 QR은 더 이상 작동하지 않습니다. 삭제할까요?')) return

    setBusyAction('delete')
    setError('')
    setNotice('')
    try {
      await deleteLostPetQrProfile(selectedPetId)
      setProfile(null)
      setVisibility(DEFAULT_VISIBILITY)
      setVisibilityDraft(DEFAULT_VISIBILITY)
      setHasConsented(false)
      setNotice('QR을 삭제했습니다. 이전 QR 주소는 더 이상 사용할 수 없습니다.')
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, 'QR을 삭제하지 못했습니다.'))
    } finally {
      setBusyAction('')
    }
  }

  if (arePetsLoading || (pets.length > 0 && selectedPetId === null)) {
    return <div className={styles.page}><p className={styles.loading}>반려동물 정보를 불러오는 중입니다.</p></div>
  }

  if (pets.length === 0) {
    return (
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.eyebrow}>LOST PET QR</h1>
          <p className={styles.introCopy}>QR을 만들려면 먼저 반려동물을 등록해 주세요.</p>
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
        <h1 className={styles.eyebrow}>LOST PET QR</h1>
        <p className={styles.introCopy}>{publicInfo.petName}를 잃어버렸을 때 발견한 분께 연락받을 수 있는 QR 코드 생성을 도와드릴게요.</p>
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
          <div className={styles.sectionHeadingRow}>
            <div className={styles.sectionHeading}>
              <span>02</span>
              <div><h2 id="public-info-heading">공개 정보 확인</h2><p>현재 등록된 보호자와 반려동물 정보입니다.</p></div>
            </div>
            {!isEditingVisibility && (
              <button
                type="button"
                className={styles.editButton}
                disabled={profile === undefined || Boolean(busyAction)}
                onClick={handleStartEditing}
              >
                공개 범위 수정
              </button>
            )}
          </div>

          <div className={styles.publicHero}>
            <div className={styles.petMark} aria-hidden="true">{getPetEmoji(publicInfo.species)}</div>
            <div>
              <small>{petDetails}</small>
              <strong>{publicInfo.petName}</strong>
            </div>
          </div>

          <dl className={styles.infoList}>
            <div><dt>보호자 이름</dt><dd>{publicInfo.guardianName || '미등록'}</dd></div>
            <div><dt>보호자 연락처</dt><dd>{publicInfo.guardianPhone || '미등록'}</dd></div>
            <div><dt>종류 및 품종</dt><dd>{petDetails}</dd></div>
            <div className={styles.medicalRow}>
              <dt>병력 및 특이사항</dt>
              <dd>{publicInfo.medicalHistory || '등록된 내용이 없습니다.'}</dd>
            </div>
          </dl>

          <div className={styles.sourceActions}>
            <Link to="/mypage/profile">회원정보 수정</Link>
            <Link to={`/pets/${selectedPetId}/edit`}>반려동물 정보 수정</Link>
          </div>

          {isEditingVisibility ? (
            <form onSubmit={handleSaveVisibility}>
              <fieldset className={styles.visibilityPanel}>
                <legend>개인정보 공개 목록</legend>
                <p>체크를 해제한 정보는 QR을 통해 공개되지 않습니다.</p>
                <label><input type="checkbox" checked disabled /><span>반려동물 이름 <small>필수</small></span></label>
                <label><input type="checkbox" checked disabled /><span>보호자 연락처 <small>필수</small></span></label>
                <label>
                  <input
                    type="checkbox"
                    checked={visibilityDraft.showGuardianName}
                    onChange={(event) => setVisibilityDraft((current) => ({ ...current, showGuardianName: event.target.checked }))}
                  />
                  <span>보호자 이름</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={visibilityDraft.showPetDetails}
                    onChange={(event) => setVisibilityDraft((current) => ({ ...current, showPetDetails: event.target.checked }))}
                  />
                  <span>반려동물 종류 및 품종</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={visibilityDraft.showMedicalHistory}
                    onChange={(event) => setVisibilityDraft((current) => ({ ...current, showMedicalHistory: event.target.checked }))}
                  />
                  <span>병력 및 특이사항</span>
                </label>
              </fieldset>

              <div className={styles.editActions}>
                <button
                  type="button"
                  disabled={busyAction === 'save'}
                  onClick={() => {
                    setVisibilityDraft(visibility)
                    setIsEditingVisibility(false)
                  }}
                >
                  취소
                </button>
                <button type="submit" disabled={busyAction === 'save'}>
                  {busyAction === 'save' ? '저장 중...' : '공개 범위 저장'}
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.visibilitySummary}>
              <strong>현재 공개 범위</strong>
              <ul>
                <li className={styles.visibleItem}>반려동물 이름 <small>필수</small></li>
                <li className={styles.visibleItem}>보호자 연락처 <small>필수</small></li>
                <li className={visibility.showGuardianName ? styles.visibleItem : styles.hiddenItem}>보호자 이름</li>
                <li className={visibility.showPetDetails ? styles.visibleItem : styles.hiddenItem}>종류 및 품종</li>
                <li className={visibility.showMedicalHistory ? styles.visibleItem : styles.hiddenItem}>병력 및 특이사항</li>
              </ul>
            </div>
          )}

          {!publicInfo.guardianPhone && (
            <p className={styles.phoneWarning}>QR을 만들려면 보호자 연락처가 필요합니다. <Link to="/mypage/profile">회원정보에서 등록하기</Link></p>
          )}

          {!profile && (
            <label className={styles.consentBox}>
              <input
                type="checkbox"
                checked={hasConsented}
                onChange={(event) => setHasConsented(event.target.checked)}
              />
              <span>QR을 활성화하면 체크한 정보가 링크를 가진 누구에게나 공개된다는 점을 확인했습니다.</span>
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
                <QrCodeSvg value={publicUrl} title={`${publicInfo.petName} 실종 대비 QR 코드`} />
                {!profile.active && <span>현재 공개 중지</span>}
              </div>
              <p className={styles.qrCaption}><strong>{publicInfo.petName}를 발견하셨나요?</strong><span>QR을 스캔하면 보호자에게 연락할 수 있습니다.</span></p>
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
                  onClick={() => void handleDelete()}
                >
                  {busyAction === 'delete' ? '삭제 중...' : 'QR 삭제'}
                </button>
              </div>
              <div className={styles.publicationNotice}>
                <span aria-hidden="true">🔔</span>
                <p>QR 공개를 희망하지 않으시면 공개를 중지하거나 삭제해 주세요.</p>
              </div>
            </>
          ) : (
            <div className={styles.emptyQr}>
              <div aria-hidden="true">＋</div>
              <strong>아직 생성된 QR이 없습니다.</strong>
              <p>왼쪽의 공개 정보를 확인하고 동의한 뒤 생성해 주세요.</p>
              <button
                type="button"
                disabled={!hasConsented || !publicInfo.guardianPhone || Boolean(busyAction)}
                onClick={() => void runAction(
                  'create',
                  () => createLostPetQrProfile(selectedPetId!, visibility),
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

    </div>
  )
}
