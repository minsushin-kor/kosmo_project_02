import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PetAvatar } from '../../pets/components/PetAvatar'
import { usePets } from '../../pets/hooks/usePets'
import shared from '../../../styles/featurePage.module.css'
import styles from './MyPage.module.css'

export function MyPage() {
  const { pets } = usePets()
  const [saved, setSaved] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaved(true)
  }

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <div><p className={shared.eyebrow}>MY PETPULSE</p><h1 className={shared.title}>마이페이지</h1><p className={shared.description}>보호자 정보와 등록된 반려동물을 관리합니다.</p></div>
      </header>

      <div className={styles.layout}>
        <form className={`${shared.panel} ${styles.profileForm}`} onSubmit={handleSubmit}>
          <div className={styles.profileHeading}><span aria-hidden="true">👤</span><div><h2>보호자 정보</h2><p>회원정보 API 연결 전 임시 프로필입니다.</p></div></div>
          <div className={styles.fieldGrid}>
            <label><span>이름</span><input required defaultValue="김보호" /></label>
            <label><span>이메일</span><input type="email" required defaultValue="guardian@example.com" /></label>
            <label><span>연락처</span><input type="tel" defaultValue="010-1234-5678" /></label>
            <label><span>알림 시간</span><input type="time" defaultValue="20:00" /></label>
          </div>
          <label className={styles.toggle}><input type="checkbox" defaultChecked /><span>건강 체크와 위험도 알림을 받습니다.</span></label>
          {saved && <div className={styles.savedMessage} role="status">보호자 정보를 저장했어요.</div>}
          <button className={shared.primaryButton} type="submit">변경사항 저장</button>
        </form>

        <aside className={`${shared.panel} ${styles.petPanel}`}>
          <div className={styles.panelHeader}><div><h2>등록된 반려동물</h2><p>총 {pets.length}마리</p></div><Link to="/pets/new">＋ 등록</Link></div>
          <div className={styles.petList}>
            {pets.map((pet) => (
              <Link to={`/pets/${pet.id}/edit`} key={pet.id}>
                <PetAvatar pet={pet} size="small" />
                <span><strong>{pet.name}</strong><small>{pet.breed}</small></span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
          <Link className={styles.manageLink} to="/pets">반려동물 전체 관리</Link>
        </aside>
      </div>
    </div>
  )
}
