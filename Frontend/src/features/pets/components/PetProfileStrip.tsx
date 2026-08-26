import { Link } from 'react-router-dom'
import { usePets } from '../hooks/usePets'
import { PetAvatar } from './PetAvatar'
import styles from './PetProfileStrip.module.css'

export function PetProfileStrip() {
  const { pets, selectedPet, selectPet } = usePets()

  if (!selectedPet || pets.length === 0) {
    return null
  }

  return (
    <section className={styles.strip} aria-label="등록된 반려동물 프로필">
      <div className={styles.stripHeading}>
        <p>MY PETS</p>
        <Link to="/pets">프로필 관리</Link>
      </div>

      <div className={styles.profileList}>
        {pets.map((pet) => {
          const isSelected = pet.id === selectedPet.id

          return (
            <button
              type="button"
              className={`${styles.profileButton} ${isSelected ? styles.selected : ''}`}
              key={pet.id}
              aria-pressed={isSelected}
              aria-label={`${pet.name} 프로필 선택`}
              onClick={() => selectPet(pet.id)}
            >
              <span className={styles.avatarRing}>
                <PetAvatar pet={pet} size="medium" />
              </span>
              <span className={styles.petName}>{pet.name}</span>
            </button>
          )
        })}

        <Link className={styles.addProfile} to="/pets/new" aria-label="새 반려동물 등록">
          <span aria-hidden="true">+</span>
          <small>아이 추가</small>
        </Link>
      </div>
    </section>
  )
}
