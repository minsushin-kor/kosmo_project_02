import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { PetAvatar } from '../../pets/components/PetAvatar'
import { usePets } from '../../pets/hooks/usePets'
import shared from '../../../styles/featurePage.module.css'
import styles from './MyPage.module.css'

export function MyPage() {
  const { currentUser } = useAuth()
  const { pets } = usePets()
  const addressSummary = currentUser?.address
    ? `${currentUser.address} ${currentUser.detailAddress ?? ''}`.trim()
    : '등록된 주소가 없습니다.'

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <div>
          <p className={shared.eyebrow}>MY PATPET</p>
          <h1 className={shared.title}>마이페이지</h1>
          <p className={shared.description}>수정할 정보의 종류를 선택해 주세요.</p>
        </div>
      </header>

      <nav className={styles.managementList} aria-label="마이페이지 관리 목록">
        <Link className={styles.managementItem} to="/mypage/profile">
          <span className={styles.itemIcon} aria-hidden="true">👤</span>
          <span className={styles.itemContent}>
            <strong>회원정보 수정</strong>
            <small>이름, 이메일, 연락처, 주소와 비밀번호를 관리합니다.</small>
            <em>
              {currentUser?.name || '보호자'} · {currentUser?.email || '이메일 없음'}<br />
              {addressSummary}
            </em>
          </span>
          <span className={styles.itemArrow} aria-hidden="true">→</span>
        </Link>

        <Link className={styles.managementItem} to="/mypage/pets">
          <span className={`${styles.itemIcon} ${styles.petIcon}`} aria-hidden="true">
            {pets[0] ? <PetAvatar pet={pets[0]} size="small" /> : '🐾'}
          </span>
          <span className={styles.itemContent}>
            <strong>반려동물 정보 수정</strong>
            <small>등록된 반려동물의 프로필을 선택해 수정합니다.</small>
            <em>
              {pets.length > 0
                ? `총 ${pets.length}마리 · ${pets.map((pet) => pet.name).join(', ')}`
                : '등록된 반려동물이 없습니다.'}
            </em>
          </span>
          <span className={styles.itemArrow} aria-hidden="true">→</span>
        </Link>
      </nav>
    </div>
  )
}
