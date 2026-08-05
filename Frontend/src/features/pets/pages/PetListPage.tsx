import { Link, useLocation } from 'react-router-dom'
import { PetAvatar } from '../components/PetAvatar'
import { usePets } from '../hooks/usePets'
import { getPetAge, sexLabel, speciesLabel } from '../types'
import styles from './PetListPage.module.css'

type PetListLocationState = {
  createdPetName?: string
  updatedPetName?: string
}

export function PetListPage() {
  const { pets, selectedPet, selectPet } = usePets()
  const location = useLocation()
  const state = location.state as PetListLocationState | null

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>MY PET FAMILY</p>
          <h1>함께 관리할 반려동물</h1>
          <p>건강 상태를 확인할 반려동물을 선택하거나 새로운 가족을 등록해 주세요.</p>
        </div>
        <Link className={styles.addButton} to="/pets/new">
          <span aria-hidden="true">＋</span> 반려동물 등록
        </Link>
      </header>

      {state?.createdPetName && (
        <div className={styles.successNotice} role="status">
          <span aria-hidden="true">✓</span>
          <p><strong>{state.createdPetName}</strong>의 프로필을 등록하고 현재 반려동물로 선택했어요.</p>
        </div>
      )}
      {state?.updatedPetName && (
        <div className={styles.successNotice} role="status">
          <span aria-hidden="true">✓</span>
          <p><strong>{state.updatedPetName}</strong>의 프로필 정보를 수정했어요.</p>
        </div>
      )}

      <section className={styles.selectedPanel} aria-labelledby="selected-pet-heading">
        <div className={styles.selectedLabel}>
          <span aria-hidden="true">●</span> 현재 선택된 반려동물
        </div>
        <div className={styles.selectedContent}>
          <PetAvatar pet={selectedPet} size="large" />
          <div className={styles.selectedInfo}>
            <p>{speciesLabel[selectedPet.species]}</p>
            <h2 id="selected-pet-heading">{selectedPet.name}</h2>
            <div className={styles.metaList}>
              <span>{selectedPet.breed}</span>
              <span>{getPetAge(selectedPet.birthDate)}</span>
              <span>{sexLabel[selectedPet.sex]}</span>
              <span>{selectedPet.weight}kg</span>
            </div>
          </div>
          <div className={styles.selectedActions}>
            <p>대시보드와 문진은 현재 선택된 반려동물을 기준으로 표시됩니다.</p>
            <div className={styles.actionLinks}>
              <Link to={`/pets/${selectedPet.id}/edit`}>프로필 수정</Link>
              <Link to="/dashboard">건강 대시보드 보기 <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.petSection} aria-labelledby="pet-list-heading">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>REGISTERED PETS</p>
            <h2 id="pet-list-heading">등록된 반려동물</h2>
          </div>
          <span>총 {pets.length}마리</span>
        </div>

        <div className={styles.petGrid}>
          {pets.map((pet) => {
            const isSelected = pet.id === selectedPet.id

            return (
              <article className={`${styles.petCard} ${isSelected ? styles.selectedCard : ''}`} key={pet.id}>
                <div className={styles.cardTop}>
                  <PetAvatar pet={pet} size="medium" />
                  {isSelected && <span className={styles.selectedBadge}>현재 선택</span>}
                </div>
                <div className={styles.cardTitle}>
                  <p>{speciesLabel[pet.species]}</p>
                  <h3>{pet.name}</h3>
                </div>
                <dl className={styles.petDetails}>
                  <div><dt>품종</dt><dd>{pet.breed}</dd></div>
                  <div><dt>나이</dt><dd>{getPetAge(pet.birthDate)}</dd></div>
                  <div><dt>성별</dt><dd>{sexLabel[pet.sex]}</dd></div>
                  <div><dt>몸무게</dt><dd>{pet.weight}kg</dd></div>
                </dl>
                <button
                  type="button"
                  disabled={isSelected}
                  onClick={() => selectPet(pet.id)}
                >
                  {isSelected ? '선택되어 있어요' : `${pet.name} 선택하기`}
                </button>
              </article>
            )
          })}

          <Link className={styles.addCard} to="/pets/new">
            <span aria-hidden="true">＋</span>
            <strong>새로운 가족 등록</strong>
            <p>기본 정보를 입력하고 건강 기록을 시작해 보세요.</p>
          </Link>
        </div>
      </section>
    </div>
  )
}
