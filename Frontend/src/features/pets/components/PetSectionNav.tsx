import { NavLink } from 'react-router-dom'
import { usePets } from '../hooks/usePets'
import { PetAvatar } from './PetAvatar'
import styles from './PetSectionNav.module.css'

const getClassName = ({ isActive }: { isActive: boolean }) => (
  isActive ? `${styles.link} ${styles.active}` : styles.link
)

export function PetSectionNav() {
  const { selectedPet } = usePets()
  const petBase = `/pets/${selectedPet.id}`

  return (
    <div className={styles.wrapper}>
      <div className={styles.petInfo}>
        <PetAvatar pet={selectedPet} size="small" />
        <span><strong>{selectedPet.name}</strong><small>건강관리 메뉴</small></span>
      </div>
      <nav className={styles.navigation} aria-label={`${selectedPet.name} 건강관리 메뉴`}>
        <NavLink className={getClassName} to="/dashboard">요약</NavLink>
        <NavLink className={getClassName} to={`${petBase}/vitals`}>생체정보</NavLink>
        <NavLink className={getClassName} to={`${petBase}/questionnaire`}>건강 문진</NavLink>
        <NavLink className={getClassName} to={`${petBase}/history`}>알림·이력</NavLink>
        <NavLink className={getClassName} to={`${petBase}/reports`}>주간 리포트</NavLink>
        <NavLink className={getClassName} to={`${petBase}/contents`}>건강 콘텐츠</NavLink>
      </nav>
    </div>
  )
}
